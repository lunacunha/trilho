// Career Service dashboard (US07). career_service role only; consenting students only.
// Calculated on every call from the students' current consent, never cached (decision 026).
import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { application, channel, company, statusChange, user as userTable } from "../../db/schema.ts";
import { isActiveStudent } from "../rules/active-student.ts";
import { lisbonToday } from "../rules/dates.ts";
import { companyStatistic } from "../rules/company-statistic.ts";
import { meetsPrivacyThreshold } from "../rules/privacy-threshold.ts";
import { replyRate } from "../rules/reply-rate.ts";
import type { StatApplication } from "../rules/types.ts";
import { AccessDeniedError } from "./errors.ts";
import type { CurrentUser, Dashboard, DashboardRow } from "./types.ts";

const consentingStudent = and(eq(userTable.consent, true), eq(userTable.role, "student"));

/** R7 per group, keeping only groups that pass R8; sorted by applications desc, then name. */
function rowsBy(groups: Map<string, StatApplication[]>): DashboardRow[] {
  const rows: DashboardRow[] = [];
  for (const [name, apps] of groups) {
    const rate = replyRate(apps);
    if (rate && meetsPrivacyThreshold(rate.applications)) {
      rows.push({ name, applications: rate.applications, replyRate: rate.rate });
    }
  }
  return rows.sort((a, b) => b.applications - a.applications || a.name.localeCompare(b.name));
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/**
 * Throws AccessDeniedError for students. Companies and channels follow R8.
 * Returns only aggregates: no names, emails, ids or per-student rows (US07-4).
 */
export async function getDashboard(user: CurrentUser, today: string): Promise<Dashboard> {
  if (user.role !== "career_service") throw new AccessDeniedError();

  const [apps, changes] = await Promise.all([
    db
      .select({
        id: application.id,
        userId: application.userId,
        dateSent: application.dateSent,
        createdAt: application.createdAt,
        companyName: company.name,
        channelName: channel.name,
      })
      .from(application)
      .innerJoin(userTable, eq(userTable.id, application.userId))
      .innerJoin(company, eq(company.id, application.companyId))
      .innerJoin(channel, eq(channel.id, application.channelId))
      .where(consentingStudent),
    db
      .select({
        applicationId: statusChange.applicationId,
        status: statusChange.status,
        changedOn: statusChange.changedOn,
        isAutomatic: statusChange.isAutomatic,
        createdAt: statusChange.createdAt,
      })
      .from(statusChange)
      .innerJoin(application, eq(application.id, statusChange.applicationId))
      .innerJoin(userTable, eq(userTable.id, application.userId))
      .where(consentingStudent)
      .orderBy(asc(statusChange.changedOn), asc(statusChange.createdAt)),
  ]);

  const changesByApp = new Map<string, typeof changes>();
  for (const c of changes) push(changesByApp, c.applicationId, c);

  const byCompany = new Map<string, StatApplication[]>();
  const byChannel = new Map<string, StatApplication[]>();
  const all: StatApplication[] = [];
  // R9: latest application created or status change made by the student (automatic R5
  // changes are not made by the student), as action timestamps.
  const lastActivity = new Map<string, Date>();
  const noteActivity = (userId: string, at: Date) => {
    const prev = lastActivity.get(userId);
    if (!prev || at > prev) lastActivity.set(userId, at);
  };

  for (const a of apps) {
    const appChanges = changesByApp.get(a.id) ?? [];
    const stat: StatApplication = {
      dateSent: a.dateSent,
      consent: true,
      changes: appChanges.map((c) => ({ status: c.status, changedOn: c.changedOn })),
    };
    push(byCompany, a.companyName, stat);
    push(byChannel, a.channelName, stat);

    all.push(stat);

    noteActivity(a.userId, a.createdAt);
    for (const c of appChanges) if (!c.isAutomatic) noteActivity(a.userId, c.createdAt);
  }

  let activeStudents = 0;
  for (const at of lastActivity.values()) {
    if (isActiveStudent({ consent: true, lastActivityOn: lisbonToday(at) }, today)) activeStudents += 1;
  }

  return {
    activeStudents,
    // Same minimum as R3: shown only with ≥ 5 replied applications from consenting students.
    medianDaysToFirstReply: companyStatistic(all)?.medianDays ?? null,
    companies: rowsBy(byCompany),
    channels: rowsBy(byChannel),
  };
}
