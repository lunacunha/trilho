// R8 — Dashboard privacy threshold: a company or channel appears only with ≥ 5 applications
// from consenting students.
import { notImplemented } from "../not-implemented.ts";

export const PRIVACY_MIN_APPLICATIONS = 5;

export function meetsPrivacyThreshold(applicationsFromConsentingStudents: number): boolean {
  return notImplemented(applicationsFromConsentingStudents);
}
