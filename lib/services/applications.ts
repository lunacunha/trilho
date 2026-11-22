// Applications service: create, read, edit, delete, status changes and the pipeline.
import { and, asc, desc, eq, gt, inArray, max, notExists } from "drizzle-orm";
import { z } from "zod";
import { db, withTransaction, type Executor } from "../../db/client.ts";
import {
  application,
  channel,
  company,
  jobType,
  reminder,
  sector,
  statusChange,
  type ApplicationStatus,
} from "../../db/schema.ts";
import type { PipelineColumn } from "../fixed-lists.ts";
import { displayCompanyName, normalizeCompanyName } from "../rules/company-name.ts";
import { daysBetween } from "../rules/dates.ts";
import { daysSinceSent } from "../rules/days-since-sent.ts";
import { NO_RESPONSE_STATUSES, noResponseDate } from "../rules/no-response.ts";
import { REMINDER_STATUSES, reminderState, reminderThreshold } from "../rules/reminder.ts";
import type { ReminderReason } from "../rules/types.ts";
import { companyStatistics } from "./companies.ts";
import {
  applicationInputSchema,
  dateSentAfterNextChangeMessage,
  statusChangeInputSchema,
  type ApplicationInput,
  type StatusChangeInput,
} from "../validation.ts";
import { AccessDeniedError, NotFoundError, ValidationError } from "./errors.ts";
import { recordEvent } from "./events.ts";
import type { ApplicationDetail, CurrentUser, Pipeline, PipelineCard } from "./types.ts";

/** SPEC §3: only students own applications. */
function requireStudent(user: CurrentUser): void {
  if (user.role !== "student") throw new AccessDeniedError();
}

/** SPEC §4: which pipeline column each status belongs to. */
const COLUMN_OF: Record<ApplicationStatus, PipelineColumn> = {
  sent: "sent",
  in_process: "in_process",
  interview: "interview",
  offer: "offer",
  rejected: "closed",
  no_response: "closed",
};

/** The fixed-list ids for an application's sector, channel and job type. */
async function listIds(tx: Executor, data: ApplicationInput) {
  const [[sectorRow], [channelRow], [jobTypeRow]] = await Promise.all([
    tx.select({ id: sector.id }).from(sector).where(eq(sector.name, data.sector)),
    tx.select({ id: channel.id }).from(channel).where(eq(channel.name, data.channel)),
    tx.select({ id: jobType.id }).from(jobType).where(eq(jobType.name, data.jobType)),
  ]);
  if (!sectorRow || !channelRow || !jobTypeRow) {
    throw new Error("Fixed lists are missing from the database (run the seed).");
  }
  return { sectorId: sectorRow.id, channelId: channelRow.id, jobTypeId: jobTypeRow.id };
}

/** R11: find or create. ON CONFLICT keeps this safe if two students add the same company at once. */
async function findOrCreateCompany(tx: Executor, name: string): Promise<string> {
  const normalizedName = normalizeCompanyName(name);
  const [inserted] = await tx
    .insert(company)
    .values({ name: displayCompanyName(name), normalizedName })
    .onConflictDoNothing({ target: company.normalizedName })
    .returning({ id: company.id });
  if (inserted) return inserted.id;
  const [existing] = await tx.select({ id: company.id }).from(company).where(eq(company.normalizedName, normalizedName));
  return existing.id;
}

const idSchema = z.uuid();

/**
 * US03-3: the user's application, or NotFoundError — the same for a missing id, a malformed
 * id and someone else's application. `lock` takes a row lock until the transaction ends.
 */
async function ownedApplication(tx: Executor, user: CurrentUser, id: string, opts: { lock?: boolean } = {}) {
  requireStudent(user);
  if (!idSchema.safeParse(id).success) throw new NotFoundError();
  const query = tx
    .select({ id: application.id, currentStatus: application.currentStatus, dateSent: application.dateSent })
    .from(application)
    .where(and(eq(application.id, id), eq(application.userId, user.id)));
  const [row] = opts.lock ? await query.for("update") : await query;
  if (!row) throw new NotFoundError();
  return row;
}

/** Status changes of one application in chronological order (ties: order of saving). */
function historyOf(tx: Executor, applicationId: string) {
  return tx
    .select({
      id: statusChange.id,
      status: statusChange.status,
      changedOn: statusChange.changedOn,
      isAutomatic: statusChange.isAutomatic,
    })
    .from(statusChange)
    .where(eq(statusChange.applicationId, applicationId))
    .orderBy(asc(statusChange.changedOn), asc(statusChange.createdAt));
}

/** US02-1/5/6: finds or creates the company (R11), inserts the application and its
 * initial status change in one transaction, and records `application_created`. */
export async function createApplication(
  user: CurrentUser,
  input: ApplicationInput,
  opts: { today: string; formSessionId?: string },
): Promise<{ id: string }> {
  requireStudent(user);
  // The entry layer already validated; re-checking keeps the service safe for other callers.
  const data = applicationInputSchema(opts.today).parse(input);

  return withTransaction(async (tx) => {
    const ids = await listIds(tx, data);
    const companyId = await findOrCreateCompany(tx, data.company);

    const [app] = await tx
      .insert(application)
      .values({
        userId: user.id,
        companyId,
        ...ids,
        roleTitle: data.roleTitle,
        dateSent: data.dateSent,
        currentStatus: "sent",
      })
      .returning({ id: application.id });

    await tx.insert(statusChange).values({ applicationId: app.id, status: "sent", changedOn: data.dateSent });

    await recordEvent(
      tx,
      user.id,
      "application_created",
      { application_id: app.id, form_session_id: opts.formSessionId ?? null },
      app.id,
    );
    return { id: app.id };
  });
}

/** SPEC §9: the new application form was shown. */
export async function recordFormOpened(user: CurrentUser, formSessionId: string): Promise<void> {
  requireStudent(user);
  await recordEvent(db, user.id, "application_form_opened", { form_session_id: formSessionId });
}

/** US03-3, US04-1: throws NotFoundError if missing or owned by someone else. */
export async function getApplication(user: CurrentUser, id: string): Promise<ApplicationDetail> {
  const owned = await ownedApplication(db, user, id);
  const [[row], history] = await Promise.all([
    db
      .select({
        companyId: company.id,
        companyName: company.name,
        roleTitle: application.roleTitle,
        sector: sector.name,
        channel: channel.name,
        jobType: jobType.name,
        dateSent: application.dateSent,
        currentStatus: application.currentStatus,
      })
      .from(application)
      .innerJoin(company, eq(company.id, application.companyId))
      .innerJoin(sector, eq(sector.id, application.sectorId))
      .innerJoin(channel, eq(channel.id, application.channelId))
      .innerJoin(jobType, eq(jobType.id, application.jobTypeId))
      .where(and(eq(application.id, owned.id), eq(application.userId, user.id))),
    historyOf(db, owned.id),
  ]);
  if (!row) throw new NotFoundError(); // deleted between the two reads

  return {
    id: owned.id,
    company: { id: row.companyId, name: row.companyName },
    roleTitle: row.roleTitle,
    sector: row.sector,
    channel: row.channel,
    jobType: row.jobType,
    dateSent: row.dateSent,
    currentStatus: row.currentStatus,
    history: history.map((h) => ({
      status: h.status,
      changedOn: h.changedOn,
      isAutomatic: h.isAutomatic,
      daysAfterSent: daysBetween(row.dateSent, h.changedOn),
    })),
  };
}

/**
 * US04-4: edits the six fields; never creates a status change. Editing the date sent also
 * moves the initial "Sent" change, which cannot pass the next status change.
 */
export async function updateApplication(
  user: CurrentUser,
  id: string,
  input: ApplicationInput,
  today: string,
): Promise<void> {
  requireStudent(user);
  const data = applicationInputSchema(today).parse(input);

  await withTransaction(async (tx) => {
    const owned = await ownedApplication(tx, user, id, { lock: true });
    const [initial, next] = await historyOf(tx, owned.id).limit(2);
    if (next && data.dateSent > next.changedOn) {
      throw new ValidationError("dateSent", dateSentAfterNextChangeMessage(next.changedOn));
    }

    const ids = await listIds(tx, data);
    const companyId = await findOrCreateCompany(tx, data.company);
    await tx
      .update(application)
      .set({ companyId, ...ids, roleTitle: data.roleTitle, dateSent: data.dateSent })
      .where(eq(application.id, owned.id));
    if (initial && initial.changedOn !== data.dateSent) {
      await tx.update(statusChange).set({ changedOn: data.dateSent }).where(eq(statusChange.id, initial.id));
    }
  });
}

/** US04-5: deletes the application and (by cascade) its history and reminders. */
export async function deleteApplication(user: CurrentUser, id: string): Promise<void> {
  requireStudent(user);
  if (!idSchema.safeParse(id).success) throw new NotFoundError();
  const deleted = await db
    .delete(application)
    .where(and(eq(application.id, id), eq(application.userId, user.id)))
    .returning({ id: application.id });
  if (deleted.length === 0) throw new NotFoundError();
}

/** US04-1/2/3/8, R6: records a status change and updates current_status in one transaction. */
export async function changeStatus(
  user: CurrentUser,
  id: string,
  input: StatusChangeInput,
  today: string,
): Promise<void> {
  await withTransaction(async (tx) => {
    // The row lock serialises concurrent changes (and R5), so R6 is checked against fresh data
    const owned = await ownedApplication(tx, user, id, { lock: true });
    const [{ lastChangeOn }] = await tx
      .select({ lastChangeOn: max(statusChange.changedOn) })
      .from(statusChange)
      .where(eq(statusChange.applicationId, owned.id));

    // R6 is enforced here, not only in the form
    const parsed = statusChangeInputSchema({
      currentStatus: owned.currentStatus,
      dateSent: owned.dateSent,
      lastChangeOn: lastChangeOn ?? owned.dateSent,
      today,
    }).safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new ValidationError(String(issue.path[0] ?? "status"), issue.message);
    }

    await tx
      .insert(statusChange)
      .values({ applicationId: owned.id, status: parsed.data.status, changedOn: parsed.data.changedOn });
    await tx.update(application).set({ currentStatus: parsed.data.status }).where(eq(application.id, owned.id));
  });
}

/** US03, US05: applies R5, then returns the student's columns with R10 and R4/R12 reminders,
 * recording `reminder_triggered` for reminders shown for the first time. */
export async function getPipeline(user: CurrentUser, today: string): Promise<Pipeline> {
  requireStudent(user);
  await applyNoResponseRule(user.id, today);

  const rows = await db
    .select({
      id: application.id,
      companyName: company.name,
      roleTitle: application.roleTitle,
      companyId: application.companyId,
      status: application.currentStatus,
      dateSent: application.dateSent,
    })
    .from(application)
    .innerJoin(company, eq(company.id, application.companyId))
    .where(eq(application.userId, user.id))
    .orderBy(desc(application.dateSent), desc(application.createdAt));

  const reminders = await evaluateReminders(user.id, rows, today);

  const columns: Pipeline["columns"] = { sent: [], in_process: [], interview: [], offer: [], closed: [] };
  for (const row of rows) {
    const card: PipelineCard = {
      id: row.id,
      companyName: row.companyName,
      roleTitle: row.roleTitle,
      status: row.status,
      daysSinceSent: daysSinceSent(row.dateSent, today),
      reminder: reminders.get(row.id) ?? null,
    };
    columns[COLUMN_OF[row.status]].push(card);
  }
  return { columns };
}

type CardReminder = { daysQuiet: number; reason: ReminderReason };

/**
 * R4/R12: the reminder to show on each of the user's Sent / In process applications.
 * A reminder shown for the first time is stored (one per quiet period) and recorded as
 * `reminder_triggered`, in one transaction.
 */
async function evaluateReminders(
  userId: string,
  rows: { id: string; companyId: string; status: ApplicationStatus }[],
  today: string,
): Promise<Map<string, CardReminder>> {
  const quiet = rows.filter((r) => (REMINDER_STATUSES as readonly ApplicationStatus[]).includes(r.status));
  const result = new Map<string, CardReminder>();
  if (quiet.length === 0) return result;

  // The last status change of each application starts its current quiet period
  const changes = await db
    .select({ id: statusChange.id, applicationId: statusChange.applicationId, changedOn: statusChange.changedOn })
    .from(statusChange)
    .where(inArray(statusChange.applicationId, quiet.map((r) => r.id)))
    .orderBy(asc(statusChange.changedOn), asc(statusChange.createdAt));
  const lastChange = new Map<string, { id: string; changedOn: string }>();
  for (const c of changes) lastChange.set(c.applicationId, { id: c.id, changedOn: c.changedOn });
  const lastChangeIds = [...lastChange.values()].map((c) => c.id);

  const [stored, stats] = await Promise.all([
    lastChangeIds.length === 0
      ? Promise.resolve([])
      : db
          .select({ statusChangeId: reminder.statusChangeId, reason: reminder.reason, outcome: reminder.outcome })
          .from(reminder)
          .where(inArray(reminder.statusChangeId, lastChangeIds)),
    companyStatistics(quiet.map((r) => r.companyId)),
  ]);
  const storedByChange = new Map(stored.map((r) => [r.statusChangeId, r]));

  for (const row of quiet) {
    const last = lastChange.get(row.id);
    if (!last) continue;
    const threshold = reminderThreshold(stats.get(row.companyId)?.medianDays ?? null);
    const existing = storedByChange.get(last.id) ?? null;
    const state = reminderState({ status: row.status, lastChange: last, today, thresholdDays: threshold.days, existing });
    const daysQuiet = daysBetween(last.changedOn, today);

    if (state === "show" && existing) {
      result.set(row.id, { daysQuiet, reason: existing.reason });
    } else if (state === "trigger") {
      await withTransaction(async (tx) => {
        // The unique quiet period keeps concurrent loads to one reminder and one event
        const inserted = await tx
          .insert(reminder)
          .values({ applicationId: row.id, statusChangeId: last.id, reason: threshold.reason, thresholdDays: threshold.days })
          .onConflictDoNothing({ target: reminder.statusChangeId })
          .returning({ id: reminder.id });
        if (inserted.length === 0) return;
        await recordEvent(
          tx,
          userId,
          "reminder_triggered",
          { application_id: row.id, reason: threshold.reason, threshold_days: threshold.days },
          row.id,
        );
      });
      result.set(row.id, { daysQuiet, reason: threshold.reason });
    }
  }
  return result;
}

/** R5: an application that must become No response, as read before converting it. */
export type NoResponseDue = {
  id: string;
  status: ApplicationStatus;
  lastChangeOn: string;
  /** Date of the automatic change: last change + 60 days. */
  date: string;
};

/** R5, evaluated on pipeline load: Sent / In process with no change for ≥ 60 days. */
async function applyNoResponseRule(userId: string, today: string): Promise<void> {
  const due = await findNoResponseDue(userId, today);
  if (due.length > 0) await convertToNoResponse(due);
}

/** R5, step 1 (exported for tests): which of the user's applications are due. */
export async function findNoResponseDue(userId: string, today: string): Promise<NoResponseDue[]> {
  const candidates = await db
    .select({
      id: application.id,
      status: application.currentStatus,
      lastChangeOn: max(statusChange.changedOn),
    })
    .from(application)
    .innerJoin(statusChange, eq(statusChange.applicationId, application.id))
    .where(and(eq(application.userId, userId), inArray(application.currentStatus, [...NO_RESPONSE_STATUSES])))
    .groupBy(application.id);

  return candidates.flatMap((c) => {
    const date = c.lastChangeOn ? noResponseDate(c.status, c.lastChangeOn, today) : null;
    return date && c.lastChangeOn ? [{ id: c.id, status: c.status, lastChangeOn: c.lastChangeOn, date }] : [];
  });
}

/**
 * R5, step 2 (exported for tests): records the automatic No response, in one transaction.
 * The guarded UPDATE converts only if, in the same statement, nothing changed since step 1:
 * - current_status is still the status read (every valid manual change alters it, R6), and
 *   Postgres re-checks it on the row even when the update waited for a concurrent commit;
 * - no status change is dated after the last change read, so the last change is still
 *   ≥ 60 days before today.
 * A status change saved at the same moment is therefore never overwritten, and two loads
 * at once record one automatic change.
 */
export async function convertToNoResponse(due: NoResponseDue[]): Promise<void> {
  await withTransaction(async (tx) => {
    for (const { id, status, lastChangeOn, date } of due) {
      const newerChange = tx
        .select({ id: statusChange.id })
        .from(statusChange)
        .where(and(eq(statusChange.applicationId, id), gt(statusChange.changedOn, lastChangeOn)));
      const updated = await tx
        .update(application)
        .set({ currentStatus: "no_response" })
        .where(and(eq(application.id, id), eq(application.currentStatus, status), notExists(newerChange)))
        .returning({ id: application.id });
      if (updated.length === 0) continue; // changed meanwhile, or converted by a concurrent load
      await tx.insert(statusChange).values({ applicationId: id, status: "no_response", changedOn: date, isAutomatic: true });
    }
  });
}
