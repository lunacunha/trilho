# Prompt 05 — Slice US04: application detail, status change, history, edit, delete

## Goal
A student can open one of her applications, see its full dated history, change its status, edit its fields and delete it — and can never touch another student's application.

## Context
Read first: `CLAUDE.md`, `SPEC.md` (R6, US03-3, US04, §10), `docs/ARCHITECTURE.md` (§3, §6), and the stubs and tests for: `lib/rules/status-transition.ts`, `lib/validation.ts` (`statusChangeInputSchema`), `lib/services/applications.ts` (`getApplication`, `changeStatus`, `updateApplication`, `deleteApplication`), `lib/services/errors.ts`.

## Scope
**In:**
- Implement: `checkStatusChange` (R6), `statusChangeInputSchema`, `getApplication`, `changeStatus`, `updateApplication`, `deleteApplication`.
- **The service enforces R6 itself** (SPEC R6: "The service enforces this rule itself, not only the form"). Add a `ValidationError` to `lib/services/errors.ts` with a field and a message, and add service-level integration tests for the rejected cases (same status, future date, before date sent, before the last change, "No response" as a target).
- `changeStatus`: inserts the status change and updates `current_status` **in one transaction**.
- Ownership: every function returns `NotFoundError` for an application that does not exist or belongs to another user (US03-3).
- `/applications/[id]` (S3):
  - Header: company name (a link to `/companies/[id]`; that page comes in prompt 06), role, sector, channel, job type, current status.
  - Change status: a select with the manual statuses only (never "No response"), a date pre-filled with today, and errors shown next to the fields.
  - History: every status change in chronological order, each with its date and "after N days" since the date sent; automatic changes marked as such.
  - Edit: the six fields with the same form and validation as `/applications/new`. Editing does not create a status change.
  - Delete: requires a confirmation step; on confirm → back to `/pipeline`; on cancel → nothing changes.
- A "Not found" page for missing or foreign applications.

**Out (do not do):**
- No reminders and no company page content (prompt 06).
- No visual polish beyond clean defaults (Phase 7).
- Do not touch the `production` database.

## Decisions already made
- Close the R5 race flagged in prompt 04: the guarded UPDATE in `getPipeline` must also check, in the same statement, that the application's last status change is still ≥ 60 days before today (e.g. `NOT EXISTS` a status change after the cutoff date). A status change saved at the same moment must never be overwritten. No extra round trip. Add an integration test for it.

## Done when
- Passing: unit tests for R6 and status-change validation (US04-2, US04-3); integration tests `ownership.test.ts`, `status-change.test.ts` and the new R6 service tests. Other tests may still fail, but only with "Not implemented".
- `npm run lint` and `npm run build` pass.
- The report includes this manual check list:
  1. As `demo@up.pt`, open an application → history in order, with "after N days".
  2. Change Sent → In process with today's date → history and pipeline update.
  3. Try the same status, a future date, and a date before the last change → each rejected with a message.
  4. "No response" is not offered in the select.
  5. Open the Mar Telecom application ("No response") and move it to Interview → allowed (late reply).
  6. Edit the role → saved; no new history entry.
  7. Delete an application: cancel first (nothing changes), then confirm (gone from the pipeline).
  8. Paste the URL of an application that belongs to another student (id from the Neon console) → "Not found".

## Process
Propose a plan first and wait for my approval. At the end, report: files changed, tests now passing, the manual check list, and open questions.