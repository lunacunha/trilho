// Companies service: suggestions (US02-4) and the company page (US06).
import { notImplemented } from "../not-implemented.ts";
import type { CompanyPage, CurrentUser } from "./types.ts";

/** Case-insensitive "contains" match, at most 5 suggestions. Students only. */
export async function suggestCompanies(
  user: CurrentUser,
  query: string,
): Promise<{ id: string; name: string }[]> {
  return notImplemented(user, query);
}

/** R2/R3, calculated on request from consenting students only. Students only. */
export async function getCompanyPage(user: CurrentUser, companyId: string): Promise<CompanyPage> {
  return notImplemented(user, companyId);
}
