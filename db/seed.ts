// Seed with FICTIONAL demo data. Every company, person and email here is made up.
//
// Run with `npm run db:seed` (uses .env.local → Neon branch `dev`).
// - Deterministic: fixed-seed PRNG; dates are offsets from "today" (Europe/Lisbon).
// - Re-runnable: deletes all Trilho data and the seeded users first.
// - Users are created through Better Auth (hashed passwords), then marked verified.

import "./env.ts";
import { inArray, sql } from "drizzle-orm";
import { auth } from "../lib/auth.ts";
import { displayCompanyName, normalizeCompanyName } from "../lib/rules/company-name.ts";
import { db, pool } from "./client.ts";
import * as s from "./schema.ts";
import type { ApplicationStatus } from "./schema.ts";

// ---------- Guards ----------

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed with NODE_ENV=production.");
  process.exit(1);
}
const SEED_PASSWORD = process.env.SEED_PASSWORD;
if (!SEED_PASSWORD || SEED_PASSWORD.length < 8) {
  console.error("SEED_PASSWORD is missing or shorter than 8 characters. Add it to your .env file.");
  process.exit(1);
}

// ---------- Deterministic helpers ----------

const SEED = 20261115;

/** mulberry32: small fixed-seed PRNG returning numbers in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const randInt = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];
function weighted<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r < 0) return item;
  }
  return items[items.length - 1][0];
}
function uuid(rng: Rng): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(rng() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const h = hex.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// ---------- Dates ----------

const NOW = new Date();
const TODAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(NOW); // YYYY-MM-DD

const DAY_MS = 86_400_000;
const dateToMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
const addDays = (d: string, n: number) => new Date(dateToMs(d) + n * DAY_MS).toISOString().slice(0, 10);
const daysBetween = (from: string, to: string) => Math.round((dateToMs(to) - dateToMs(from)) / DAY_MS);
const ago = (n: number) => addDays(TODAY, -n);
/** A timestamp on a given date at hh:mm (UTC), never later than one minute ago. */
function at(d: string, hour: number, minute = 0): Date {
  const ms = dateToMs(d) + (hour * 60 + minute) * 60_000;
  return new Date(Math.min(ms, NOW.getTime() - 60_000));
}
const plusMinutes = (t: Date, m: number) => new Date(Math.min(t.getTime() + m * 60_000, NOW.getTime() - 30_000));

function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

// ---------- Fixed lists (SPEC §5) ----------

const SECTORS = [
  "Consulting",
  "Energy & Utilities",
  "Finance & Banking",
  "Industry & Manufacturing",
  "Logistics & Supply Chain",
  "Retail & Consumer Goods",
  "Technology & Software",
  "Telecom",
  "Health",
  "Public Sector",
  "Other",
] as const;

const CHANNELS = [
  "Company portal",
  "LinkedIn Easy Apply",
  "LinkedIn (external)",
  "Referral",
  "Career Fair",
  "Job board",
  "Spontaneous application",
  "Other",
] as const;
type Channel = (typeof CHANNELS)[number];

const JOB_TYPES = [
  "Summer internship",
  "Professional internship",
  "Trainee programme",
  "Full-time",
  "Dissertation in a company",
] as const;
type JobType = (typeof JOB_TYPES)[number];

// Channel mix and how much each channel changes the chance of a reply.
const CHANNEL_WEIGHTS: readonly (readonly [Channel, number])[] = [
  ["Company portal", 20],
  ["LinkedIn Easy Apply", 17],
  ["LinkedIn (external)", 11],
  ["Referral", 9],
  ["Career Fair", 16],
  ["Job board", 10],
  ["Spontaneous application", 9],
  ["Other", 8],
];
const CHANNEL_REPLY_FACTOR: Record<Channel, number> = {
  "Company portal": 1,
  "LinkedIn Easy Apply": 0.6,
  "LinkedIn (external)": 0.9,
  Referral: 1.4,
  "Career Fair": 1.3,
  "Job board": 0.8,
  "Spontaneous application": 0.7,
  Other: 0.9,
};

const JOB_TYPE_WEIGHTS: readonly (readonly [JobType, number])[] = [
  ["Summer internship", 20],
  ["Professional internship", 30],
  ["Trainee programme", 20],
  ["Full-time", 20],
  ["Dissertation in a company", 10],
];
const JOB_TITLES: Record<JobType, string> = {
  "Summer internship": "Summer Intern",
  "Professional internship": "Intern",
  "Trainee programme": "Graduate Trainee",
  "Full-time": "Junior Analyst",
  "Dissertation in a company": "Master's Dissertation",
};
const AREAS = [
  "Operations",
  "Data",
  "Finance",
  "Supply Chain",
  "Strategy",
  "Software",
  "Process Improvement",
  "Marketing",
  "Quality",
  "Project Management",
] as const;

// ---------- Fictional companies ----------

type CompanyPlan = {
  name: string;
  sector: (typeof SECTORS)[number];
  apps: number; // applications from the 25 demo students
  replyRate: number; // base chance of a first response
  delay: number; // typical response time in days
  maxReplies?: number; // hard cap so the company stays without a statistic
};

const COMPANIES: CompanyPlan[] = [
  // With a statistic (R3)
  { name: "Lumen Energy", sector: "Energy & Utilities", apps: 34, replyRate: 0.7, delay: 17 },
  { name: "Northwind Consulting", sector: "Consulting", apps: 30, replyRate: 0.65, delay: 10 },
  { name: "Douro Software", sector: "Technology & Software", apps: 28, replyRate: 0.6, delay: 21 },
  { name: "Brisa Bank", sector: "Finance & Banking", apps: 24, replyRate: 0.6, delay: 26 },
  { name: "Atlântico Retail", sector: "Retail & Consumer Goods", apps: 22, replyRate: 0.65, delay: 7 },
  // Without a statistic (< 5 replied applications from consenting students)
  { name: "Ferro Industrial", sector: "Industry & Manufacturing", apps: 12, replyRate: 0.3, delay: 20, maxReplies: 3 },
  { name: "Vela Logistics", sector: "Logistics & Supply Chain", apps: 11, replyRate: 0.3, delay: 15, maxReplies: 3 },
  { name: "Mar Telecom", sector: "Telecom", apps: 10, replyRate: 0.3, delay: 18, maxReplies: 4 },
  { name: "Norte Health", sector: "Health", apps: 9, replyRate: 0.3, delay: 12, maxReplies: 2 },
  // Fewer than 5 applications in total (hidden in the dashboard, R8)
  { name: "Cávado Analytics", sector: "Technology & Software", apps: 3, replyRate: 0.5, delay: 9 },
  { name: "Ribeira Foods", sector: "Retail & Consumer Goods", apps: 2, replyRate: 0.5, delay: 14 },
  { name: "Gaia Engineering", sector: "Industry & Manufacturing", apps: 1, replyRate: 0.5, delay: 11 },
];

// ---------- Fictional users ----------

type SeedUser = {
  key: string;
  name: string;
  email: string;
  role: "student" | "career_service";
  consent: boolean | null;
};

const STUDENT_COUNT = 25;
const NON_CONSENTING = new Set([4, 9, 13, 17, 21, 25]); // 19 of 25 consent (76%)

const CAREER_SERVICE: SeedUser = {
  key: "careers",
  name: "Demo Career Service",
  email: "careers@fe.up.pt",
  role: "career_service",
  consent: null,
};
const DEMO: SeedUser = {
  key: "demo",
  name: "Demo Account",
  email: "demo@up.pt",
  role: "student",
  consent: true,
};
const STUDENTS: SeedUser[] = Array.from({ length: STUDENT_COUNT }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    key: `s${n}`,
    name: `Demo Student ${n}`,
    email: `demo.student${n}@up.pt`,
    role: "student",
    consent: !NON_CONSENTING.has(i + 1),
  };
});
const ALL_USERS = [CAREER_SERVICE, DEMO, ...STUDENTS];

// ---------- Application generation ----------

type Change = { status: ApplicationStatus; on: string; automatic: boolean };
type PlannedApp = {
  id: string;
  userKey: string;
  company: string;
  sector: string;
  channel: Channel;
  jobType: JobType;
  roleTitle: string;
  dateSent: string;
  createdAt: Date;
  changes: Change[];
  rng: Rng; // per-application stream for reminders and events
};

const isQuietStatus = (st: ApplicationStatus) => st === "sent" || st === "in_process";

/**
 * Applies R5 to a history the way the system would have: if the last change is
 * Sent / In process and ≥ 60 days old, append an automatic "No response" at last + 60.
 */
function withR5(changes: Change[]): Change[] {
  const last = changes[changes.length - 1];
  if (isQuietStatus(last.status) && daysBetween(last.on, TODAY) >= 60) {
    return [...changes, { status: "no_response", on: addDays(last.on, 60), automatic: true }];
  }
  return changes;
}

function generateStudentApps(): PlannedApp[] {
  const apps: PlannedApp[] = [];
  let index = 0;
  for (const plan of COMPANIES) {
    let replies = 0;
    for (let k = 0; k < plan.apps; k++) {
      // Fixed number of draws per application → independent of "today"
      const rng = mulberry32(SEED + ++index * 7919);
      const studentKey = STUDENTS[Math.floor(rng() * STUDENTS.length)].key;
      const channel = weighted(rng, CHANNEL_WEIGHTS);
      const jobType = weighted(rng, JOB_TYPE_WEIGHTS);
      const area = pick(rng, AREAS);
      const sentAgo = randInt(rng, 0, 120);
      const logLag = rng() < 0.7 ? 0 : randInt(rng, 1, 2);
      const logHour = randInt(rng, 9, 22);
      const replyRoll = rng();
      const delayFactor = 0.5 + rng() * 1.1;
      const firstRoll = rng();
      const step2Roll = rng();
      const step2Delay = randInt(rng, 5, 20);
      const step3Roll = rng();
      const step3Delay = randInt(rng, 5, 15);
      const id = uuid(rng);

      const dateSent = ago(sentAgo);
      const changes: Change[] = [{ status: "sent", on: dateSent, automatic: false }];

      const replyChance = Math.min(0.95, plan.replyRate * CHANNEL_REPLY_FACTOR[channel]);
      const replyOn = addDays(dateSent, Math.max(1, Math.round(plan.delay * delayFactor)));
      const canReply = plan.maxReplies === undefined || replies < plan.maxReplies;
      if (canReply && replyRoll < replyChance && replyOn <= TODAY) {
        replies++;
        const first: ApplicationStatus =
          firstRoll < 0.3 ? "rejected" : firstRoll < 0.85 ? "in_process" : "interview";
        changes.push({ status: first, on: replyOn, automatic: false });

        let current = first;
        let currentOn = replyOn;
        if (current === "in_process") {
          const next: ApplicationStatus | null =
            step2Roll < 0.45 ? "interview" : step2Roll < 0.8 ? "rejected" : null;
          const nextOn = addDays(currentOn, step2Delay);
          if (next && nextOn <= TODAY) {
            changes.push({ status: next, on: nextOn, automatic: false });
            current = next;
            currentOn = nextOn;
          }
        }
        if (current === "interview") {
          const next: ApplicationStatus | null =
            step3Roll < 0.35 ? "offer" : step3Roll < 0.75 ? "rejected" : null;
          const nextOn = addDays(currentOn, step3Delay);
          if (next && nextOn <= TODAY) {
            changes.push({ status: next, on: nextOn, automatic: false });
          }
        }
      }

      const loggedOn = addDays(dateSent, logLag) > TODAY ? TODAY : addDays(dateSent, logLag);
      apps.push({
        id,
        userKey: studentKey,
        company: plan.name,
        sector: plan.sector,
        channel,
        jobType,
        roleTitle: `${area} ${JOB_TITLES[jobType]}`,
        dateSent,
        createdAt: at(loggedOn, logHour, randInt(rng, 0, 59)),
        changes: withR5(changes),
        rng,
      });
    }
  }
  return apps;
}

/** Hand-written cases for the live demo account (demo@up.pt). */
function generateDemoApps(): { apps: PlannedApp[]; r5Pending: string } {
  type DemoCase = {
    company: string;
    channel: Channel;
    jobType: JobType;
    role: string;
    history: [ApplicationStatus, number][]; // [status, days ago]
    skipR5?: boolean;
  };
  const cases: DemoCase[] = [
    // R4: past the company median → reminder on load
    { company: "Lumen Energy", channel: "Career Fair", jobType: "Trainee programme", role: "Operations Trainee", history: [["sent", 30]] },
    // R4 fallback: company without a statistic, 15 days quiet → 14-day reminder
    { company: "Ferro Industrial", channel: "Company portal", jobType: "Professional internship", role: "Process Improvement Intern", history: [["sent", 15]] },
    // R5: Sent, last change 70 days ago → becomes "No response" when the pipeline loads
    { company: "Mar Telecom", channel: "Job board", jobType: "Full-time", role: "Junior Network Analyst", history: [["sent", 70]], skipR5: true },
    { company: "Douro Software", channel: "LinkedIn Easy Apply", jobType: "Summer internship", role: "Software Summer Intern", history: [["sent", 3]] },
    { company: "Northwind Consulting", channel: "Referral", jobType: "Full-time", role: "Business Analyst", history: [["sent", 18], ["in_process", 5]] },
    { company: "Brisa Bank", channel: "Company portal", jobType: "Trainee programme", role: "Risk Graduate Trainee", history: [["sent", 40], ["in_process", 20]] },
    { company: "Atlântico Retail", channel: "Career Fair", jobType: "Professional internship", role: "Supply Chain Intern", history: [["sent", 45], ["in_process", 38], ["interview", 20]] },
    { company: "Douro Software", channel: "Referral", jobType: "Dissertation in a company", role: "Master's Dissertation in Data Engineering", history: [["sent", 60], ["in_process", 45], ["interview", 35], ["offer", 10]] },
    { company: "Northwind Consulting", channel: "LinkedIn (external)", jobType: "Summer internship", role: "Strategy Summer Intern", history: [["sent", 50], ["rejected", 30]] },
    { company: "Norte Health", channel: "Spontaneous application", jobType: "Professional internship", role: "Quality Intern", history: [["sent", 100]] },
  ];

  let r5Pending = "";
  const apps = cases.map((c, i) => {
    const rng = mulberry32(SEED + 500_000 + i * 7919);
    const changes: Change[] = c.history.map(([status, d]) => ({ status, on: ago(d), automatic: false }));
    const id = uuid(rng);
    if (c.skipR5) r5Pending = id;
    const dateSent = changes[0].on;
    return {
      id,
      userKey: DEMO.key,
      company: c.company,
      sector: COMPANIES.find((p) => p.name === c.company)!.sector,
      channel: c.channel,
      jobType: c.jobType,
      roleTitle: c.role,
      dateSent,
      createdAt: at(dateSent, randInt(rng, 9, 21), randInt(rng, 0, 59)),
      changes: c.skipR5 ? changes : withR5(changes),
      rng,
    };
  });
  return { apps, r5Pending };
}

// ---------- Statistics used by the seed (mirrors R1–R3) ----------

/** R1: days from date sent to the first change from Sent to any status except No response. */
function responseTime(app: PlannedApp): number | null {
  const first = app.changes.slice(1).find((c) => c.status !== "no_response" && c.status !== "sent");
  return first ? daysBetween(app.dateSent, first.on) : null;
}

type CompanyStat = { replied: number; median: number | null };
function companyStats(apps: PlannedApp[], consenting: Set<string>): Map<string, CompanyStat> {
  const stats = new Map<string, CompanyStat>();
  for (const plan of COMPANIES) {
    const times = apps
      .filter((a) => a.company === plan.name && consenting.has(a.userKey))
      .map(responseTime)
      .filter((t): t is number => t !== null);
    stats.set(plan.name, { replied: times.length, median: times.length >= 5 ? median(times) : null });
  }
  return stats;
}

/** R4 threshold in whole days (days are integers, so "≥ 16.5" equals "≥ 17"). */
function thresholdFor(stat: CompanyStat): { days: number; reason: "company_median" | "fallback_14_days" } {
  return stat.median !== null
    ? { days: Math.ceil(stat.median), reason: "company_median" }
    : { days: 14, reason: "fallback_14_days" };
}

// ---------- Main ----------

async function main() {
  const host = new URL(process.env.DATABASE_URL!).host;
  console.log(`Seeding database at host: ${host}`);
  console.log(`Today (Europe/Lisbon): ${TODAY}\n`);

  // 1. Plan everything in memory
  const studentApps = generateStudentApps();
  const { apps: demoApps, r5Pending } = generateDemoApps();
  const apps = [...demoApps, ...studentApps];
  const consenting = new Set(ALL_USERS.filter((u) => u.role === "student" && u.consent).map((u) => u.key));
  const stats = companyStats(apps, consenting);

  // 2. Check the distribution the demo needs before touching the database
  const withStat = COMPANIES.filter((c) => stats.get(c.name)!.median !== null);
  const smallCompanies = COMPANIES.filter((c) => apps.filter((a) => a.company === c.name).length < 5);
  const problems: string[] = [];
  if (withStat.length < 4) problems.push(`only ${withStat.length} companies have a statistic (need ≥ 4)`);
  if (COMPANIES.length - withStat.length < 3) problems.push("fewer than 3 companies without a statistic");
  if (smallCompanies.length < 1) problems.push("no company with fewer than 5 applications");
  const lumen = stats.get("Lumen Energy")!;
  if (lumen.median === null || Math.ceil(lumen.median) > 30) problems.push("Lumen Energy must have a statistic with median ≤ 30 days");
  if (stats.get("Ferro Industrial")!.median !== null) problems.push("Ferro Industrial must have no statistic");
  const demoStatuses = new Set(demoApps.map((a) => a.changes[a.changes.length - 1].status));
  demoStatuses.add("no_response"); // the R5-pending case becomes No response on load
  if (demoStatuses.size < 6) problems.push("demo account does not cover every status");
  if (problems.length) throw new Error(`Seed plan is inconsistent: ${problems.join("; ")}`);

  // 3. Delete existing Trilho data and the seeded users
  const seededEmails = ALL_USERS.map((u) => u.email);
  await db.execute(
    sql`TRUNCATE TABLE product_event, reminder, status_change, application, company, sector, channel, job_type`,
  );
  await db.delete(s.user).where(inArray(s.user.email, seededEmails));

  // 4. Create users through Better Auth (hashed passwords)
  const userIds = new Map<string, string>();
  for (const u of ALL_USERS) {
    const res = await auth.api.signUpEmail({
      body: { name: u.name, email: u.email, password: SEED_PASSWORD! },
    });
    userIds.set(u.key, res.user.id);
  }
  const userId = (key: string) => userIds.get(key)!;

  // 5. Build rows
  const sectorIds = new Map(SECTORS.map((n, i) => [n, uuid(mulberry32(SEED + 900_000 + i))]));
  const channelIds = new Map(CHANNELS.map((n, i) => [n, uuid(mulberry32(SEED + 910_000 + i))]));
  const jobTypeIds = new Map(JOB_TYPES.map((n, i) => [n, uuid(mulberry32(SEED + 920_000 + i))]));
  const companyIds = new Map(COMPANIES.map((c, i) => [c.name, uuid(mulberry32(SEED + 930_000 + i))]));

  const applicationRows: (typeof s.application.$inferInsert)[] = [];
  const changeRows: (typeof s.statusChange.$inferInsert)[] = [];
  const reminderRows: (typeof s.reminder.$inferInsert)[] = [];
  const eventRows: (typeof s.productEvent.$inferInsert)[] = [];
  const firstActivity = new Map<string, Date>();
  const noteActivity = (key: string, t: Date) => {
    const prev = firstActivity.get(key);
    if (!prev || t < prev) firstActivity.set(key, t);
  };

  for (const app of apps) {
    const rng = app.rng;
    const uid = userId(app.userKey);
    const last = app.changes[app.changes.length - 1];
    applicationRows.push({
      id: app.id,
      userId: uid,
      companyId: companyIds.get(app.company)!,
      sectorId: sectorIds.get(app.sector as (typeof SECTORS)[number])!,
      channelId: channelIds.get(app.channel)!,
      jobTypeId: jobTypeIds.get(app.jobType)!,
      roleTitle: app.roleTitle,
      dateSent: app.dateSent,
      currentStatus: last.status,
      createdAt: app.createdAt,
      updatedAt: last.on === app.dateSent ? app.createdAt : at(last.on, 20),
    });

    // Form events (M1, M2): opened 10–90 s before the application was saved
    const formSessionId = uuid(rng);
    const openedAt = new Date(app.createdAt.getTime() - randInt(rng, 10, 90) * 1000);
    noteActivity(app.userKey, openedAt);
    eventRows.push(
      { userId: uid, name: "application_form_opened", properties: { form_session_id: formSessionId }, createdAt: openedAt },
      { userId: uid, name: "application_created", applicationId: app.id, properties: { application_id: app.id, form_session_id: formSessionId }, createdAt: app.createdAt },
    );

    const stat = stats.get(app.company)!;
    app.changes.forEach((change, i) => {
      const changeId = uuid(rng);
      const createdAt = i === 0 ? app.createdAt : change.automatic ? at(change.on, 12) : at(change.on, randInt(rng, 9, 22));
      changeRows.push({
        id: changeId,
        applicationId: app.id,
        status: change.status,
        changedOn: change.on,
        isAutomatic: change.automatic,
        createdAt,
      });

      // Historical reminders (R4, R12): one per quiet period that passed its threshold
      const triggerLag = randInt(rng, 0, 3);
      const outcomeRoll = rng();
      const outcomeLagMin = randInt(rng, 1, 2880);
      if (!isQuietStatus(change.status)) return;
      const next = app.changes[i + 1];
      const isOpenPeriod = next === undefined;
      if (isOpenPeriod && app.userKey === DEMO.key) return; // decision: the live demo triggers these
      const { days, reason } = thresholdFor(stat);
      const triggerOn = addDays(change.on, days + triggerLag);
      const periodEnd = next ? next.on : TODAY;
      if (triggerOn >= periodEnd && !(isOpenPeriod && triggerOn === TODAY)) return;
      if (triggerOn > TODAY) return;
      const triggeredAt = at(triggerOn, randInt(rng, 9, 22));
      const outcome = outcomeRoll < 0.55 ? "followup_done" : outcomeRoll < 0.8 ? "dismissed" : null;
      const outcomeAt = outcome ? plusMinutes(triggeredAt, outcomeLagMin) : null;
      reminderRows.push({
        id: uuid(rng),
        applicationId: app.id,
        statusChangeId: changeId,
        reason,
        thresholdDays: days,
        triggeredAt,
        outcome,
        outcomeAt,
      });
      eventRows.push({
        userId: uid,
        name: "reminder_triggered",
        applicationId: app.id,
        properties: { application_id: app.id, reason, threshold_days: days },
        createdAt: triggeredAt,
      });
      if (outcome && outcomeAt) {
        eventRows.push({
          userId: uid,
          name: outcome === "followup_done" ? "reminder_followup_done" : "reminder_dismissed",
          applicationId: app.id,
          properties: { application_id: app.id },
          createdAt: outcomeAt,
        });
      }
    });
  }

  // Abandoned forms (M2): opened, never saved
  const abandonRng = mulberry32(SEED + 990_000);
  const ABANDONED = 30;
  for (let i = 0; i < ABANDONED; i++) {
    const app = apps[Math.floor(abandonRng() * apps.length)];
    const openedAt = new Date(app.createdAt.getTime() - randInt(abandonRng, 30, 600) * 60_000);
    noteActivity(app.userKey, openedAt);
    eventRows.push({
      userId: userId(app.userKey),
      name: "application_form_opened",
      properties: { form_session_id: uuid(abandonRng) },
      createdAt: openedAt,
    });
  }

  // 6. Write everything in one transaction
  await db.transaction(async (tx) => {
    // Users: verified, role, consent, registration dates before their first activity
    const userRng = mulberry32(SEED + 980_000);
    for (const u of ALL_USERS) {
      const first = firstActivity.get(u.key) ?? new Date(dateToMs(ago(130)) + 10 * 3_600_000);
      const createdAt = new Date(first.getTime() - (randInt(userRng, 0, 3) * 24 + 3) * 3_600_000);
      const verifiedAt = new Date(createdAt.getTime() + randInt(userRng, 2, 60) * 60_000);
      const consentAt = new Date(verifiedAt.getTime() + randInt(userRng, 1, 5) * 60_000);
      await tx
        .update(s.user)
        .set({
          emailVerified: true,
          emailVerifiedAt: verifiedAt,
          role: u.role,
          consent: u.consent,
          consentUpdatedAt: u.consent === null ? null : consentAt,
          createdAt,
          updatedAt: consentAt,
        })
        .where(sql`${s.user.id} = ${userId(u.key)}`);
    }
    // Sessions created by sign-up are not needed
    await tx.delete(s.session).where(inArray(s.session.userId, [...userIds.values()]));

    await tx.insert(s.sector).values(SECTORS.map((name) => ({ id: sectorIds.get(name)!, name })));
    await tx.insert(s.channel).values(CHANNELS.map((name) => ({ id: channelIds.get(name)!, name })));
    await tx.insert(s.jobType).values(JOB_TYPES.map((name) => ({ id: jobTypeIds.get(name)!, name })));
    await tx.insert(s.company).values(
      COMPANIES.map((c) => ({
        id: companyIds.get(c.name)!,
        name: displayCompanyName(c.name),
        normalizedName: normalizeCompanyName(c.name),
        createdAt: new Date(dateToMs(ago(125))),
      })),
    );

    const chunked = async <T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>) => {
      for (let i = 0; i < rows.length; i += 400) await insert(rows.slice(i, i + 400));
    };
    await chunked(applicationRows, (c) => tx.insert(s.application).values(c));
    await chunked(changeRows, (c) => tx.insert(s.statusChange).values(c));
    await chunked(reminderRows, (c) => tx.insert(s.reminder).values(c));
    await chunked(eventRows, (c) => tx.insert(s.productEvent).values(c));
  });

  // 7. Report counts from the database
  const count = async (table: string) => {
    const r = await db.execute<{ n: number }>(sql.raw(`SELECT count(*)::int AS n FROM "${table}"`));
    return r.rows[0].n;
  };
  console.log("Rows in the database:");
  for (const t of ["user", "account", "sector", "channel", "job_type", "company", "application", "status_change", "reminder", "product_event"]) {
    console.log(`  ${t.padEnd(14)} ${await count(t)}`);
  }

  const byName = await db.execute<{ name: string; n: number }>(
    sql`SELECT name, count(*)::int AS n FROM product_event GROUP BY name ORDER BY name`,
  );
  console.log("\nProduct events:");
  for (const r of byName.rows) console.log(`  ${r.name.padEnd(24)} ${r.n}`);

  const byStatus = await db.execute<{ current_status: string; n: number }>(
    sql`SELECT current_status, count(*)::int AS n FROM application GROUP BY current_status ORDER BY current_status`,
  );
  console.log("\nApplications by status:");
  for (const r of byStatus.rows) console.log(`  ${r.current_status.padEnd(12)} ${r.n}`);

  console.log("\nApplications by channel (all / consenting):");
  for (const ch of CHANNELS) {
    const all = apps.filter((a) => a.channel === ch);
    console.log(`  ${ch.padEnd(24)} ${String(all.length).padStart(3)} / ${all.filter((a) => consenting.has(a.userKey)).length}`);
  }

  console.log("\nCompanies (applications · replied by consenting students · median days):");
  for (const c of COMPANIES) {
    const st = stats.get(c.name)!;
    const n = apps.filter((a) => a.company === c.name).length;
    console.log(
      `  ${c.name.padEnd(22)} ${String(n).padStart(3)} · ${String(st.replied).padStart(2)} · ${st.median === null ? "no statistic" : st.median}`,
    );
  }

  console.log("\nDemo account (demo@up.pt) — expected on pipeline load:");
  for (const app of demoApps) {
    const last = app.changes[app.changes.length - 1];
    const quiet = daysBetween(last.on, TODAY);
    let note = "";
    if (app.id === r5Pending) note = `R5 → No response dated ${addDays(last.on, 60)}`;
    else if (isQuietStatus(last.status)) {
      const { days, reason } = thresholdFor(stats.get(app.company)!);
      if (quiet >= days) note = `reminder (${reason}, threshold ${days} d)`;
    }
    console.log(`  ${app.company.padEnd(22)} ${last.status.padEnd(11)} quiet ${String(quiet).padStart(3)} d  ${note}`);
  }
  console.log(`\nAll seeded users share the password from SEED_PASSWORD. Data is fictional.`);
}

main()
  .then(() => pool.end())
  .catch(async (error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    await pool.end();
    process.exit(1);
  });
