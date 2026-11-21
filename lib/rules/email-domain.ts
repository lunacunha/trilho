// US01-2: only University of Porto emails can register. Used by the registration form
// schema and by the Better Auth hook, so the rule lives in one place.

export const ALLOWED_EMAIL_DOMAINS = ["up.pt", "fe.up.pt"] as const;

/** True when the domain after the last "@" is exactly up.pt or fe.up.pt (any case). */
export function isAllowedEmailDomain(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at <= 0) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain);
}
