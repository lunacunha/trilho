# Prompt 08 — Slice US08: withdraw consent, delete account

## Goal
A student can change her consent at any time and delete her account and all her data — the GDPR rights at the core of Trilho. After this slice, every automated test passes.

## Context
Read first: `CLAUDE.md`, `SPEC.md` (US08, decisions 026–027 in `docs/decisions.md`), `docs/data-model.md` (delete behaviour), and the stubs and tests for: `lib/services/consent.ts` (`setConsent`, already implemented in prompt 03), `lib/services/accounts.ts` (`deleteAccount`), `tests/integration/delete-account.test.ts`, `consent-filter.test.ts` (US08-1).

## Scope
**In:**
- Implement `deleteAccount`: deletes the user; the database cascades to sessions, accounts, applications, status changes, reminders and product events. The user is logged out.
- `/settings/privacy`:
  - Current consent, with the date of the last choice.
  - "Withdraw consent" or "Share anonymously" (whichever applies), calling `setConsent`. A one-line explanation of what changes.
  - "Delete my account": a confirmation step that explains what will be deleted; on confirm → logged out → a page with "Your account and data were deleted".
- Delete `lib/not-implemented.ts` if no stub uses it any more.

**Out (do not do):**
- No data export.
- No visual polish beyond clean defaults (Phase 7).
- Do not touch the `production` database.

## Done when
- **`npm test`: every test passes** (unit and integration).
- `npm run lint` and `npm run build` pass.
- The report includes this manual check list:
  1. As `demo@up.pt`, withdraw consent → the privacy page shows "not sharing" with today's date; give it again → back to sharing.
  2. Register a new test account with my `@up.pt` email (or reuse it), log an application, then delete the account → "Your account and data were deleted".
  3. Log in with the deleted account → fails.
  4. Register again with the same email → a new, empty account.
  5. Afterwards, re-run `npm run db:seed` on `dev` to restore the demo data.

## Process
Propose a plan first and wait for my approval. At the end, report: files changed, final test counts, the manual check list, and open questions.