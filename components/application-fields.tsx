"use client";

// The six application fields (US02, US04-4), shared by the new and edit forms.
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FormField, SelectField } from "@/components/form-field";
import { CHANNELS, JOB_TYPES, SECTORS } from "@/lib/fixed-lists";
import type { ApplicationInput } from "@/lib/validation";

export type ApplicationField = keyof ApplicationInput;

type Props = {
  today: string;
  values?: Partial<Record<ApplicationField, string>>;
  errors?: Partial<Record<ApplicationField, string[]>>;
};

const SUGGESTION_DELAY_MS = 200;

export function ApplicationFields({ today, values, errors = {} }: Props) {
  const suggestions = useCompanySuggestions();
  return (
    <>
      <FormField
        id="company"
        label="Company"
        autoComplete="off"
        list="company-suggestions"
        defaultValue={values?.company}
        errors={errors.company}
        onChange={suggestions.onChange}
      />
      <datalist id="company-suggestions">
        {suggestions.names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <FormField
        id="roleTitle"
        label="Role"
        autoComplete="off"
        defaultValue={values?.roleTitle}
        errors={errors.roleTitle}
      />
      <SelectField
        id="sector"
        label="Sector"
        options={SECTORS}
        placeholder="Choose a sector"
        defaultValue={values?.sector}
        errors={errors.sector}
      />
      <SelectField
        id="channel"
        label="Channel"
        options={CHANNELS}
        placeholder="Choose a channel"
        defaultValue={values?.channel}
        errors={errors.channel}
      />
      <SelectField
        id="jobType"
        label="Job type"
        options={JOB_TYPES}
        placeholder="Choose a job type"
        defaultValue={values?.jobType}
        errors={errors.jobType}
      />
      <FormField
        id="dateSent"
        label="Date sent"
        type="date"
        max={today}
        defaultValue={values?.dateSent ?? today}
        errors={errors.dateSent}
      />
    </>
  );
}

/** US02-4: fetches up to 5 matching company names while the student types. */
function useCompanySuggestions() {
  const [names, setNames] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      inFlight.current?.abort();
    },
    [],
  );

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const query = event.target.value.trim();
    if (timer.current) clearTimeout(timer.current);
    inFlight.current?.abort();
    if (query === "") {
      setNames([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      inFlight.current = controller;
      try {
        const res = await fetch(`/api/companies/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return; // suggestions are a convenience: the form still works without them
        const data = (await res.json()) as { id: string; name: string }[];
        setNames(data.map((c) => c.name));
      } catch {
        // aborted or offline: keep the current suggestions
      }
    }, SUGGESTION_DELAY_MS);
  }

  return { names, onChange };
}
