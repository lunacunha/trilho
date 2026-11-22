"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { buttonClass, FormField, SelectField } from "@/components/form-field";
import { CHANNELS, JOB_TYPES, SECTORS } from "@/lib/fixed-lists";
import { createApplicationAction, formOpenedAction, type NewApplicationState } from "./actions";

const initialState: NewApplicationState = {};
const SUGGESTION_DELAY_MS = 200;

type Props = { today: string; formSessionId: string };

export function NewApplicationForm({ today, formSessionId }: Props) {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialState);
  const suggestions = useCompanySuggestions();

  // SPEC §9: record application_form_opened once, when the form is actually shown
  // (not during a prefetch). The ref guards against React Strict Mode's double effect.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    void formOpenedAction(formSessionId).catch(() => {});
  }, [formSessionId]);

  const values = state.values;
  const errors = state.fieldErrors ?? {};
  return (
    // The key remounts the fields after a failed submit, so they show the values typed (US02-2)
    <form key={state.submitId ?? 0} action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="form_session_id" value={formSessionId} />
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
      <FormField id="roleTitle" label="Role" autoComplete="off" defaultValue={values?.roleTitle} errors={errors.roleTitle} />
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
      {state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Saving…" : "Save application"}
      </button>
    </form>
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
