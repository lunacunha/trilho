# Prompt 07 — Slice US07: Career Service dashboard

## Goal
A Career Service member sees anonymous, aggregated employability data during the search: active students, median time to first reply, reply rate per company and per channel — with the consent filter and the privacy threshold applied.

## Context
Read first: `CLAUDE.md`, `SPEC.md` (R7, R8, R9, US07, §3 roles), `docs/ARCHITECTURE.md` (§3, §6), and the stubs and tests for: `lib/rules/reply-rate.ts`, `privacy-threshold.ts`, `active-student.ts`, `lib/services/dashboard.ts` (`getDashboard`).

## Scope
**In:**
- Implement: `replyRate` (R7), `meetsPrivacyThreshold` (R8), `isActiveStudent` (R9), `getDashboard`.
- `getDashboard` throws `AccessDeniedError` for any role other than `career_service`. It counts only consenting students, hides companies and channels with fewer than 5 applications, and returns no names, emails or per-student rows.
- `/admin/overview` (S5), replacing the placeholder:
  - Two indicators: **Active students** and **Median time to first reply** (days).
  - **Companies table:** company, applications, reply rate — sorted by applications, descending.
  - **Channel comparison:** a bar chart of reply rate per channel with Chart.js (install `chart.js`, approved), plus the same data as an accessible table below the chart.
  - A short note: "Only students who consented are counted. Companies and channels with fewer than 5 applications are hidden."
- If time is short, the chart may be left out; the channel table is mandatory.

**Out (do not do):**
- No filters or CSV export (US12, out of scope).
- No visual polish beyond clean defaults (Phase 7).
- Do not touch the `production` database.

## Done when
- Passing: unit tests for R7, R8, R9; integration tests `dashboard-access.test.ts`, the dashboard parts of `consent-filter.test.ts` (US07-3) and the R8 dashboard test. Other tests may still fail, but only with "Not implemented".
- `npm run lint` and `npm run build` pass.
- The report includes this manual check list:
  1. Log in as `careers@fe.up.pt` → dashboard with both indicators, the companies table and the channel comparison.
  2. Cávado Analytics, Ribeira Foods and Gaia Engineering do not appear.
  3. The companies table matches my hand-written query Q2 in `docs/product/queries.sql` (same companies, same reply rates).
  4. As `demo@up.pt`, open `/admin/overview` → "Access denied".
  5. No names or emails anywhere on the page.

## Process
Propose a plan first and wait for my approval. At the end, report: files changed, tests now passing, the manual check list, and open questions.