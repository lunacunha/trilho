// Entry-layer helper shared by the new (US02) and edit (US04-4) actions: reads the six
// fields from the form and validates them with the same Zod schema.
import type { ApplicationField } from "@/components/application-fields";
import { applicationInputSchema, type ApplicationInput } from "@/lib/validation";

export type ApplicationFormValues = Record<ApplicationField, string>;
export type ApplicationFieldErrors = Partial<Record<ApplicationField, string[]>>;

const FIELDS: ApplicationField[] = ["company", "roleTitle", "sector", "channel", "jobType", "dateSent"];

export function parseApplicationForm(
  formData: FormData,
  today: string,
):
  | { ok: true; values: ApplicationFormValues; data: ApplicationInput }
  | { ok: false; values: ApplicationFormValues; fieldErrors: ApplicationFieldErrors } {
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")])) as ApplicationFormValues;
  const parsed = applicationInputSchema(today).safeParse(values);
  if (parsed.success) return { ok: true, values, data: parsed.data };

  const fieldErrors: ApplicationFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as ApplicationField;
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, values, fieldErrors };
}
