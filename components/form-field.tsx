// Labelled input with its error messages (SPEC §11: every input has a label).
type FormFieldProps = {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  defaultValue?: string;
  errors?: string[];
  hint?: string;
};

export function FormField({ id, label, type = "text", autoComplete, defaultValue, errors, hint }: FormFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, errors?.length ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="rounded border border-zinc-400 px-3 py-2 text-base focus:outline-2 focus:outline-offset-1 focus:outline-blue-600"
      />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-zinc-600">
          {hint}
        </p>
      )}
      {errors?.length ? (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

export const buttonClass =
  "rounded bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 disabled:opacity-60";

export const linkClass = "text-blue-700 underline hover:text-blue-900";
