// Applications service: create, read, edit, delete, status changes and the pipeline.
import { and, desc, eq, inArray, max } from "drizzle-orm";
import { db } from "../../db/client.ts";
import {
  application,
  channel,
  company,
  jobType,
  sector,
  statusChange,
  type ApplicationStatus,
} from "../../db/schema.ts";
import type { PipelineColumn } from "../fixed-lists.ts";
import { notImplemented } from "../not-implemented.ts";
import { displayCompanyName, normalizeCompanyName } from "../rules/company-name.ts";
import { daysSinceSent } from "../rules/days-since-sent.ts";
import { NO_RESPONSE_STATUSES, noResponseDate } from "../rules/no-response.ts";
import { applicationInputSchema, type ApplicationInput, type StatusChangeInput } from "../validation.ts";
import { AccessDeniedError } from "./errors.ts";
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

  return db.transaction(async (tx) => {
    const [[sectorRow], [channelRow], [jobTypeRow]] = await Promise.all([
      tx.select({ id: sector.id }).from(sector).where(eq(sector.name, data.sector)),
      tx.select({ id: channel.id }).from(channel).where(eq(channel.name, data.channel)),
      tx.select({ id: jobType.id }).from(jobType).where(eq(jobType.name, data.jobType)),
    ]);
    if (!sectorRow || !channelRow || !jobTypeRow) {
      throw new Error("Fixed lists are missing from the database (run the seed).");
    }

    // R11: find or create. ON CONFLICT keeps this safe if two students add the same company at once.
    const normalizedName = normalizeCompanyName(data.company);
    const [inserted] = await tx
      .insert(company)
      .values({ name: displayCompanyName(data.company), normalizedName })
      .onConflictDoNothing({ target: company.normalizedName })
      .returning({ id: company.id });
    const companyId =
      inserted?.id ??
      (await tx.select({ id: company.id }).from(company).where(eq(company.normalizedName, normalizedName)))[0].id;

    const [app] = await tx
      .insert(application)
      .values({
        userId: user.id,
        companyId,
        sectorId: sectorRow.id,
        channelId: channelRow.id,
        jobTypeId: jobTypeRow.id,
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
  return notImplemented(user, id);
}

/** US04-4: edits fields; never creates a status change. */
export async function updateApplication(
  user: CurrentUser,
  id: string,
  input: ApplicationInput,
  today: string,
): Promise<void> {
  return notImplemented(user, id, input, today);
}

/** US04-5: deletes the application and (by cascade) its history and reminders. */
export async function deleteApplication(user: CurrentUser, id: string): Promise<void> {
  return notImplemented(user, id);
}

/** US04-1/2/3/8, R6: records a status change and updates current_status in one transaction. */
export async function changeStatus(
  user: CurrentUser,
  id: string,
  input: StatusChangeInput,
  today: string,
): Promise<void> {
  return notImplemented(user, id, input, today);
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
      status: application.currentStatus,
      dateSent: application.dateSent,
    })
    .from(application)
    .innerJoin(company, eq(company.id, application.companyId))
    .where(eq(application.userId, user.id))
    .orderBy(desc(application.dateSent), desc(application.createdAt));

  const columns: Pipeline["columns"] = { sent: [], in_process: [], interview: [], offer: [], closed: [] };
  for (const row of rows) {
    const card: PipelineCard = {
      id: row.id,
      companyName: row.companyName,
      roleTitle: row.roleTitle,
      status: row.status,
      daysSinceSent: daysSinceSent(row.dateSent, today),
      reminder: null, // R4/R12 come with prompt 06
    };
    columns[COLUMN_OF[row.status]].push(card);
  }
  return { columns };
}

/**
 * R5, evaluated on pipeline load: Sent / In process with no change for ≥ 60 days becomes
 * No response, recorded automatically at last change + 60 days. One transaction; the guarded
 * UPDATE makes it idempotent even when two loads run at the same time.
 */
async function applyNoResponseRule(userId: string, today: string): Promise<void> {
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

  const due = candidates.flatMap((c) => {
    const date = c.lastChangeOn ? noResponseDate(c.status, c.lastChangeOn, today) : null;
    return date ? [{ id: c.id, date }] : [];
  });
  if (due.length === 0) return;

  await db.transaction(async (tx) => {
    for (const { id, date } of due) {
      const updated = await tx
        .update(application)
        .set({ currentStatus: "no_response" })
        .where(and(eq(application.id, id), inArray(application.currentStatus, [...NO_RESPONSE_STATUSES])))
        .returning({ id: application.id });
      if (updated.length === 0) continue; // already converted by a concurrent load
      await tx.insert(statusChange).values({ applicationId: id, status: "no_response", changedOn: date, isAutomatic: true });
    }
  });
}
