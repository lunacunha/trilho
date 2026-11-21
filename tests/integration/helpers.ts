// Fixtures for integration tests. Real code (no stubs): inserts rows directly.
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import * as s from "@/db/schema";
import type { ApplicationStatus, UserRole } from "@/db/schema";
import { CHANNELS, JOB_TYPES, SECTORS, type Channel, type JobType, type Sector } from "@/lib/fixed-lists";
import { normalizeCompanyName } from "@/lib/rules/company-name";
import type { CurrentUser } from "@/lib/services/types";

/** Fixed "today" for integration tests. */
export const TODAY = "2026-11-15";

/** Local date helper (does not use the stubbed rules). */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
export const daysAgo = (n: number, today = TODAY) => addDays(today, -n);
const noonOf = (date: string) => new Date(`${date}T12:00:00Z`);

const listIds = {
  sector: new Map<string, string>(),
  channel: new Map<string, string>(),
  jobType: new Map<string, string>(),
};

/** Empties every table (test branch only) and reloads the fixed lists. */
export async function resetDatabase(): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE
    product_event, reminder, status_change, application, company,
    sector, channel, job_type, verification, session, account, "user" CASCADE`);
  const sectors = await db.insert(s.sector).values(SECTORS.map((name) => ({ name }))).returning();
  const channels = await db.insert(s.channel).values(CHANNELS.map((name) => ({ name }))).returning();
  const jobTypes = await db.insert(s.jobType).values(JOB_TYPES.map((name) => ({ name }))).returning();
  listIds.sector = new Map(sectors.map((r) => [r.name, r.id]));
  listIds.channel = new Map(channels.map((r) => [r.name, r.id]));
  listIds.jobType = new Map(jobTypes.map((r) => [r.name, r.id]));
}

export type TestUser = CurrentUser & { name: string; email: string };

let userCounter = 0;
export async function createUser(
  opts: { role?: UserRole; consent?: boolean | null; name?: string } = {},
): Promise<TestUser> {
  userCounter += 1;
  const role = opts.role ?? "student";
  const consent = opts.consent === undefined ? (role === "student" ? true : null) : opts.consent;
  const name = opts.name ?? `Test User ${userCounter}`;
  const email = `test.user${userCounter}.${randomUUID().slice(0, 8)}@up.pt`;
  const id = randomUUID();
  await db.insert(s.user).values({
    id,
    name,
    email,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    role,
    consent,
    consentUpdatedAt: consent === null ? null : new Date(),
  });
  return { id, role, consent, name, email };
}

export async function createCompany(name: string): Promise<{ id: string; name: string }> {
  const [row] = await db
    .insert(s.company)
    .values({ name: name.trim(), normalizedName: normalizeCompanyName(name) })
    .returning();
  return { id: row.id, name: row.name };
}

/** [status, changedOn, isAutomatic?] — the first entry must be ["sent", dateSent]. */
export type HistoryStep = [ApplicationStatus, string] | [ApplicationStatus, string, boolean];

export type InsertedApplication = { id: string; statusChangeIds: string[] };

/** Inserts an application with its full history; current_status = last step. */
export async function insertApplication(opts: {
  user: { id: string };
  company: { id: string };
  dateSent: string;
  /** Changes after the initial "sent". */
  then?: HistoryStep[];
  roleTitle?: string;
  sector?: Sector;
  channel?: Channel;
  jobType?: JobType;
}): Promise<InsertedApplication> {
  const history: HistoryStep[] = [["sent", opts.dateSent], ...(opts.then ?? [])];
  const last = history[history.length - 1];
  const [app] = await db
    .insert(s.application)
    .values({
      userId: opts.user.id,
      companyId: opts.company.id,
      sectorId: listIds.sector.get(opts.sector ?? "Energy & Utilities")!,
      channelId: listIds.channel.get(opts.channel ?? "Company portal")!,
      jobTypeId: listIds.jobType.get(opts.jobType ?? "Trainee programme")!,
      roleTitle: opts.roleTitle ?? "Operations Trainee",
      dateSent: opts.dateSent,
      currentStatus: last[0],
      // Timestamps follow the fixture dates, not the real clock (tests use a fixed TODAY)
      createdAt: noonOf(opts.dateSent),
      updatedAt: noonOf(last[1]),
    })
    .returning({ id: s.application.id });
  const changes = await db
    .insert(s.statusChange)
    .values(
      history.map(([status, changedOn, isAutomatic]) => ({
        applicationId: app.id,
        status,
        changedOn,
        isAutomatic: isAutomatic ?? false,
        createdAt: noonOf(changedOn),
      })),
    )
    .returning({ id: s.statusChange.id });
  return { id: app.id, statusChangeIds: changes.map((c) => c.id) };
}

/**
 * Gives a company a statistic: one application per response time, from `owner`
 * (consenting by default), each answered with "in_process" after N days.
 */
export async function insertRepliedApplications(
  owner: { id: string },
  company: { id: string },
  responseDays: number[],
  opts: { channel?: Channel } = {},
): Promise<void> {
  for (const days of responseDays) {
    const dateSent = daysAgo(100);
    await insertApplication({
      user: owner,
      company,
      dateSent,
      then: [["in_process", addDays(dateSent, days)]],
      channel: opts.channel,
    });
  }
}

export async function insertReminder(opts: {
  applicationId: string;
  statusChangeId: string;
  outcome?: "followup_done" | "dismissed" | null;
}): Promise<void> {
  await db.insert(s.reminder).values({
    applicationId: opts.applicationId,
    statusChangeId: opts.statusChangeId,
    reason: "fallback_14_days",
    thresholdDays: 14,
    outcome: opts.outcome ?? null,
    outcomeAt: opts.outcome ? new Date() : null,
  });
}

export async function insertEvent(opts: {
  userId: string;
  name: s.ProductEventName;
  applicationId?: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(s.productEvent).values({
    userId: opts.userId,
    name: opts.name,
    applicationId: opts.applicationId ?? null,
    properties: opts.properties ?? {},
  });
}

// ---------- Reads ----------

export async function getApplicationRow(id: string) {
  const [row] = await db.select().from(s.application).where(eq(s.application.id, id));
  return row;
}

export async function getStatusChanges(applicationId: string) {
  return db
    .select()
    .from(s.statusChange)
    .where(eq(s.statusChange.applicationId, applicationId))
    .orderBy(s.statusChange.changedOn, s.statusChange.createdAt);
}

export async function getReminders(applicationId: string) {
  return db.select().from(s.reminder).where(eq(s.reminder.applicationId, applicationId));
}

export async function getEvents(name?: s.ProductEventName) {
  const rows = await db.select().from(s.productEvent);
  return name ? rows.filter((r) => r.name === name) : rows;
}

export async function countCompanies(): Promise<number> {
  const rows = await db.select({ id: s.company.id }).from(s.company);
  return rows.length;
}
