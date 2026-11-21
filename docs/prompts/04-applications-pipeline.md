# Prompt 04 — Slices US02 + US03: log an application, see the pipeline

## Goal
A logged-in student can log a new application in a few seconds and see all her applications in the pipeline, grouped by status, with the 60-day rule applied on load.

## Context
Read first: `CLAUDE.md`, `SPEC.md` (§4 statuses, §5 fixed lists, R5, R10, R11, US02, US03, US04-6/7, §9 events, §10 validation), `docs/ARCHITECTURE.md` (§3 layers, §5 request flows), `docs/data-model.md`, and the stubs and tests for: `lib/rules/dates.ts`, `days-since-sent.ts`, `no-response.ts`, `lib/validation.ts` (`applicationInputSchema`), `lib/services/applications.ts` (`createApplication`, `getPipeline`), `companies.ts` (`suggestCompanies`), `events.ts`.

## Scope
**In:**
- Implement: `daysBetween`, `addDays`, `lisbonToday`, `daysSinceSent` (R10), `noResponseDate` (R5), `applicationInputSchema`, `recordEvent`, `suggestCompanies`, `createApplication`, `getPipeline`.
- `createApplication`: finds or creates the company (R11), inserts the application and the initial status change ("Sent", date sent) **in one transaction**, and records `application_created` with `form_session_id`.
- `getPipeline`: first applies R5 (status change marked automatic, dated last change + 60 days, `current_status` updated in the same transaction), then returns the columns Sent, In process, Interview, Offer, Closed (Rejected + No response) with counts and cards. For now every card has `reminder: null` (reminders are prompt 06).
- `/applications/new` (S2): company (text input with suggestions from `suggestCompanies`, max 5), role, sector, channel, job type (selects from the fixed lists), date sent (default today). A hidden `form_session_id` generated when the form opens; the page records `application_form_opened`. Server Action validates with Zod, calls the service, redirects to `/pipeline`. On error: message next to each field, values kept.
- `/pipeline` (S1): the 5 columns with counts; each card shows company, role, days since sent; Closed cards show "Rejected" or "No response"; each card links to `/applications/[id]` (that page comes in prompt 05). Empty state: short message + "Log your first application" button. A "+ New application" button.

**Out (do not do):**
- No application detail, editing, status changes or deleting (prompt 05).
- No reminders and no company page (prompt 06).
- No visual polish beyond clean, readable defaults (Phase 7).
- Do not touch the `production` database.

## Decisions already made
- Exact message: "Date sent cannot be in the future".
- The company suggestion list can be a simple accessible list or `<datalist>`; no extra dependency.
- "Today" comes from `lisbonToday(new Date())` in the entry layer and is passed to the services.

## Done when
- Passing: unit tests for R5, R10, dates and application validation (US02-2, US02-3, US02-7, §10); integration tests `create-application.test.ts` and the US03-1, US03-3 (pipeline part), US04-6 and US04-7 cases. Other tests may still fail, but only with "Not implemented" (US05-1 in `pipeline.test.ts` stays red until prompt 06).
- `npm run lint` and `npm run build` pass.
- The report includes this manual check list:
  1. Log in as `demo@up.pt` → pipeline with counts in every column; Mar Telecom is now in Closed as "No response".
  2. New application with company " lumen  ENERGY " → appears under Sent, linked to the existing Lumen Energy (no duplicate in suggestions afterwards).
  3. Type "lu" in company → Lumen Energy appears in the suggestions.
  4. Save with an empty field → error next to it, other values kept.
  5. Date in the future → "Date sent cannot be in the future".
  6. Time yourself logging one application from the pipeline (target < 30 s).
  7. Check at 375 px width that the form and pipeline are usable.

## Process
Propose a plan first and wait for my approval. At the end, report: files changed, tests now passing, the manual check list, and open questions.