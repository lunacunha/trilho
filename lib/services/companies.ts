// Companies service: suggestions (US02-4) and the company page (US06).
import { asc, ilike } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { company } from "../../db/schema.ts";
import { notImplemented } from "../not-implemented.ts";
import { normalizeCompanyName } from "../rules/company-name.ts";
import { AccessDeniedError } from "./errors.ts";
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

/** R2/R3, calculated on request from consenting students only. Students only. */
export async function getCompanyPage(user: CurrentUser, companyId: string): Promise<CompanyPage> {
  return notImplemented(user, companyId);
}
