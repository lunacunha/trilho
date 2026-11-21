# Prompt 06 — Slices US06 + US05: company response time, follow-up reminders

## Goal
A student sees each company's typical response time (only with enough consented data), and the pipeline reminds her to follow up when an application goes quiet.

## Context
Read first: `CLAUDE.md`, `SPEC.md` (R1, R2, R3, R4, R12, US05, US06, §9 events), `docs/ARCHITECTURE.md` (§5 reading flow), `docs/data-model.md` (`reminder`, `product_event`), and the stubs and tests for: `lib/rules/first-response.ts`, `response-range.ts`, `company-statistic.ts`, `reminder.ts`, `lib/services/companies.ts` (`getCompanyPage`), `reminders.ts`, and the reminder part of `applications.ts` (`getPipeline`).

## Scope
**In:**
- Implement: `firstResponse` (R1), `median`, `typicalRange`, `formatTypicalRange` (R2), `companyStatistic` (R3), `reminderThreshold`, `reminderState` (R4, R12), `getCompanyPage`, `markFollowUpDone`, `dismissReminder`.
- Extend `getPipeline`: for each application in Sent or In process, compute the threshold (company median rounded up, or 14 days) and the reminder state for its current quiet period. On "trigger", insert one `reminder` row (unique per status change) and record `reminder_triggered` with `reason` and `threshold_days`. Cards with a visible reminder show `{ daysQuiet, reason }`.
- `markFollowUpDone` / `dismissReminder`: set the outcome on the visible reminder, record the event, never change the status. If no reminder is showing → `NotFoundError` (US05-6).
- Statistics are calculated on request from consenting students only (decision 026); never cached.
- `/companies/[id]` (S4): company name; "Typical response time: X" and "Median-based range · based on N student applications", or "Not enough data yet". Nothing else: no reply or rejection rates, rankings, comparisons or individual data (US06-5).
- Pipeline card with a reminder: "N days · Follow up?" with "Follow-up done" and "Dismiss" buttons (Server Actions), keyboard-accessible.

**Out (do not do):**
- No dashboard (prompt 07), no privacy page (prompt 08).
- No email or push notifications.
- No visual polish beyond clean defaults (Phase 7).
- Do not touch the `production` database.

## Done when
- Passing: unit tests for R1, R2, R3, R4, R12; integration tests `reminders.test.ts`, US05-1 in `pipeline.test.ts`, and the company-statistic parts of `consent-filter.test.ts` (US06-1/3/4); US06-5 service test. Other tests may still fail, but only with "Not implemented".
- `npm run lint` and `npm run build` pass.
- The report includes this manual check list (seed data):
  1. Company pages: Atlântico Retail (median 8) → "1–2 weeks"; Lumen Energy (15) → "2–3 weeks"; Douro Software (25) → "3–4 weeks"; Ferro Industrial → "Not enough data yet". Each shows "based on N".
  2. As `demo@up.pt`, the pipeline shows reminders on Lumen Energy (company median) and Ferro Industrial (14 days); none on Brisa Bank (In process, 20 days < median 30) or Atlântico Retail (Interview).
  3. Click "Follow-up done" on Lumen → reminder disappears, status unchanged; reload → still hidden.
  4. Click "Dismiss" on Ferro → disappears; reload → still hidden.
  5. Company pages never show rates or rankings.

## Process
Propose a plan first and wait for my approval. At the end, report: files changed, tests now passing, the manual check list, and open questions.