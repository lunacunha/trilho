// Labelled inputs with their error messages (SPEC §11: every input has a label).
import type { ChangeEvent } from "react";

type FieldBase = {
  id: string;
  label: string;
  defaultValue?: string;
  errors?: string[];
  hint?: string;
};

type FormFieldProps = FieldBase & {
  type?: "text" | "email" | "password" | "date";
  autoComplete?: string;
  /** Upper bound for date inputs ("YYYY-MM-DD"). */
  max?: string;
  /** id of a <datalist> with suggestions. */
  list?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** An example of the expected format. Never real-looking personal data. */
  placeholder?: string;
};

const controlClass =
  "rounded border border-border bg-surface-raised px-3 py-2 text-base placeholder:text-fg-muted focus:outline-2 focus:outline-offset-1 focus:outline-focus";

function describedBy(id: string, hint?: string, errors?: string[]): string | undefined {
  return [hint ? `${id}-hint` : null, errors?.length ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

function FieldMessages({ id, hint, errors }: Pick<FieldBase, "id" | "hint" | "errors">) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {errors?.length ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {errors.join(" ")}
        </p>
      ) : null}
    </>
  );
}

export function FormField({
  id,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  errors,
  hint,
  max,
  list,
  onChange,
  placeholder,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-accent">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        max={max}
        list={list}
        onChange={onChange}
        placeholder={placeholder}
        required
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, errors)}
        className={controlClass}
      />
      <FieldMessages id={id} hint={hint} errors={errors} />
    </div>
  );
}

export type SelectOption = string | { value: string; label: string };

type SelectFieldProps = FieldBase & {
  /** A string is both the value and the label. */
  options: readonly SelectOption[];
  /** Shown first with an empty value, so nothing is chosen by default. */
  placeholder: string;
};

export function SelectField({ id, label, options, placeholder, defaultValue, errors, hint }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-accent">
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={defaultValue ?? ""}
        required
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, errors)}
        className={controlClass}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const { value, label } = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      <FieldMessages id={id} hint={hint} errors={errors} />
    </div>
  );
}

const buttonBase =
  "inline-block rounded-full px-5 py-2 text-center font-medium focus:outline-2 focus:outline-offset-2 disabled:opacity-60";

/** Primary action: sage green (mockup), darkened for AA — see docs/ux-review.md "Visual design". */
export const buttonClass = `${buttonBase} bg-primary text-on-primary hover:bg-primary-hover focus:outline-focus`;

/** Secondary action: light neutral with a 3:1 boundary. */
export const secondaryButtonClass = `${buttonBase} border border-border bg-secondary text-fg hover:bg-secondary-hover focus:outline-focus`;

/** Destructive action. */
export const dangerButtonClass = `${buttonBase} bg-danger text-on-danger hover:bg-danger-hover focus:outline-danger`;

export const linkClass = "text-primary underline hover:text-primary-hover";
