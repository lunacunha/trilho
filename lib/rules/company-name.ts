// R11 — Company name normalisation. Pure functions, no database.

/** Display name: the version typed by the student, trimmed. */
export function displayCompanyName(name: string): string {
  return name.trim();
}

/**
 * Key used to decide whether two names are the same company:
 * trimmed, repeated inner spaces collapsed, lowercase.
 * Example: " lumen  ENERGY " → "lumen energy".
 */
export function normalizeCompanyName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
