// Companies service: suggestions (US02-4) and the company page (US06).
import { asc, eq, ilike, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/client.ts";
import { application, company, statusChange, user as userTable } from "../../db/schema.ts";
import { normalizeCompanyName } from "../rules/company-name.ts";
import { companyStatistic, type CompanyStatistic } from "../rules/company-statistic.ts";
import { formatTypicalRange, typicalRange } from "../rules/response-range.ts";
import type { StatApplication } from "../rules/types.ts";
import { AccessDeniedError, NotFoundError } from "./errors.ts";
import type { CompanyPage, CurrentUser } from "./types.ts";

export const MAX_SUGGESTIONS = 5;

/** Escapes LIKE wildcards so the query is matched literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Case-insensitive "contains" match, at most 5 suggestions. Students only. */
export async function suggestCompanies(
  user: CurrentUser,
  query: string,
): Promise<{ id: string; name: string }[]> {
  if (user.role !== "student") throw new AccessDeniedError();
  const needle = normalizeCompanyName(query);
  if (needle === "") return [];
  return db
    .select({ id: company.id, name: company.name })
    .from(company)
    .where(ilike(company.normalizedName, `%${escapeLike(needle)}%`))
    .orderBy(asc(company.name))
    .limit(MAX_SUGGESTIONS);
}

/**
 * R3 statistics for the given companies, keyed by company id (companies without one are absent).
 * Calculated on every call from the owners' current consent, never cached (decision 026).
 */
export async function companyStatistics(companyIds: string[]): Promise<Map<string, CompanyStatistic>> {
  const ids = [...new Set(companyIds)];
  if (ids.length === 0) return new Map();

  const [apps, changes] = await Promise.all([
    db
      .select({
        id: application.id,
        companyId: application.companyId,
        dateSent: application.dateSent,
        consent: userTable.consent,
      })
      .from(application)
      .innerJoin(userTable, eq(userTable.id, application.userId))
      .where(inArray(application.companyId, ids)),
    db
      .select({ applicationId: statusChange.applicationId, status: statusChange.status, changedOn: statusChange.changedOn })
      .from(statusChange)
      .innerJoin(application, eq(application.id, statusChange.applicationId))
      .where(inArray(application.companyId, ids))
      .orderBy(asc(statusChange.changedOn), asc(statusChange.createdAt)),
  ]);

  const changesByApp = new Map<string, StatApplication["changes"]>();
  for (const c of changes) {
    const list = changesByApp.get(c.applicationId) ?? [];
    list.push({ status: c.status, changedOn: c.changedOn });
    changesByApp.set(c.applicationId, list);
  }
  const appsByCompany = new Map<string, StatApplication[]>();
  for (const a of apps) {
    const list = appsByCompany.get(a.companyId) ?? [];
    list.push({ dateSent: a.dateSent, consent: a.consent, changes: changesByApp.get(a.id) ?? [] });
    appsByCompany.set(a.companyId, list);
  }

  const result = new Map<string, CompanyStatistic>();
  for (const [companyId, list] of appsByCompany) {
    const stat = companyStatistic(list);
    if (stat) result.set(companyId, stat);
  }
  return result;
}

const idSchema = z.uuid();

/**
 * US06: R2/R3, calculated on request from consenting students only. Students only.
 * Returns only the name and the statistic (US06-5): no rates, rankings or student data.
 */
export async function getCompanyPage(user: CurrentUser, companyId: string): Promise<CompanyPage> {
  if (user.role !== "student") throw new AccessDeniedError();
  if (!idSchema.safeParse(companyId).success) throw new NotFoundError();
  const [row] = await db.select({ id: company.id, name: company.name }).from(company).where(eq(company.id, companyId));
  if (!row) throw new NotFoundError();

  const stat = (await companyStatistics([row.id])).get(row.id);
  return {
    id: row.id,
    name: row.name,
    statistic: stat ? { label: formatTypicalRange(typicalRange(stat.medianDays)), basedOn: stat.basedOn } : null,
  };
}
