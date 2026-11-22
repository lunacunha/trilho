# Trilho — Product metrics (M1–M7 + M4b)

_Phase 6 · Instrumentation. Definitions: `docs/product/mvp-scope.md` §5 (hypotheses) and §6 (metrics). Queries: `docs/product/metrics.sql`._

Every metric is computed from data the MVP already records: the product events in SPEC §9 (`product_event`) and the `user`, `application` and `status_change` tables. No extra event or column was needed. Only `student` accounts are counted.

> **Seed results validate the queries, not the hypotheses. Real values come from the pilot (Phase 9).**

## Metrics

Results: `npm run metrics` on the Neon `dev` branch (fictional seed data, plus the developer's own test account), 22 Nov 2026.

| Metric | Definition | Events / tables used | Hypothesis | Target | Result on seed data (22 Nov) | Decision rule |
|---|---|---|---|---|---|---|
| **M1** Median time to log an application | Median of (`application_created` time − matching `application_form_opened` time), matched by form session id; successful saves only | Events `application_form_opened`, `application_created` (`form_session_id`) | H1 | < 30 s | **44.5 s** (196 saved sessions) | If M1 > 30 s → simplify the form (fewer required fields, remember the last channel and sector) |
| **M2** Form completion rate | Form sessions saved ÷ form sessions opened | Events `application_form_opened`, `application_created` (`form_session_id`) | H1 | ≥ 80% | **86.7%** (196 / 226) | If M2 < 80% → simplify the form |
| **M3** Consent rate | Students whose current choice is "share" ÷ students who answered the consent screen; overall and per registration week (Monday start, Europe/Lisbon) | `user` (`consent`, `created_at`, `role`) | H2 | ≥ 60% | **77.8%** (21 / 27); weekly rates from 50.0% to 100.0% on cohorts of 1–8 students | If M3 < 40% → rewrite the consent screen to explain the benefit; never pre-tick consent |
| **M4** Follow-up rate | Reminders marked "Follow-up done" ÷ (follow-up done + dismissed) | Events `reminder_followup_done`, `reminder_dismissed` | H3 | ≥ 60% | **70.9%** (73 / 103) | Many dismissals → raise the threshold; many ignored → change the card's emphasis or message; confirm with 2–3 pilot conversations first |
| **M4b** Follow-up rate by reason | M4 split by the reason of the reminder each outcome belongs to | Events `reminder_triggered` (`reason`, `application_id`), `reminder_followup_done`, `reminder_dismissed` | H3 | Company-based > 14-day | **company_median 68.5%** (50 / 73) · **fallback_14_days 76.7%** (23 / 30) | If company-based is not higher → company statistics add no value to reminders; consider the simple 14-day rule |
| **M5** Reminder action rate | Reminders marked "Follow-up done" ÷ reminders triggered (one `reminder_triggered` per reminder, not per page view) | Events `reminder_triggered`, `reminder_followup_done` | H3 | ≥ 40% | **58.4%** (73 / 125) | If M5 < 40% → change the card's emphasis or message |
| **M6** Activation rate | Students with ≥ 3 applications created before registration + 7 days ÷ verified students who registered at least 7 days ago | `user` (`created_at`, `email_verified`, `role`), `application` (`created_at`) | — | ≥ 50% | **0.0%** (0 / 26) — see note | If M6 < 50% → interview non-activated students; if the barrier is logging past applications, prioritise US14 (import) |
| **M7** Week-4 retention | Activated students with ≥ 1 activity from registration + 21 days (included) to registration + 28 days (excluded) ÷ activated students who registered at least 28 days ago. Activity = application created or manual status change (R9), by when it was made | `user`, `application` (`created_at`), `status_change` (`created_at`, `is_automatic`) | — | ≥ 40% | **no value** (0 / 0) — see note | If M7 < 40% → investigate whether reminders and company statistics give students a reason to come back |

**Notes on the seed results**
- **M1, M2, M4, M4b, M5:** the seed draws form times (10–90 s), abandoned forms (30) and reminder outcomes (55% follow-up, 25% dismissed, 20% ignored) at random. The results match those settings, which is what validates the queries. M4b showing 14-day reminders ahead of company reminders is noise from the random draw, not a finding.
- **M3:** 25 seeded students with 19 consenting (76%), plus the demo account and one real test account. Weekly rows are tiny cohorts; in the pilot, read weekly rates only with a reasonable cohort size.
- **M6 = 0%:** the seed spreads each student's ~8 applications over 120 days, so nobody logs 3 in their first week. This is a property of the seed, not a bug in the query (the integration test checks the activated case).
- **M7 has no denominator** because no student is activated. The query is covered by integration tests (day 22 and day 29 boundaries, manual vs automatic changes).

## How to run

```bash
npm run metrics
```

- Reads `DATABASE_URL` from `.env.local` (Neon branch `dev`), the same way as `npm run db:seed`.
- Runs every query in `docs/product/metrics.sql` inside one `READ ONLY` transaction, then rolls it back. It cannot change data.
- Prints one table per metric. Output is aggregates only: no ids, names or emails.
- To add or change a metric, edit `metrics.sql`. Each statement starts with a `-- M<n>: <name>` comment and a `-- Formula:` line, and ends with `;` at the end of a line. `tests/unit/metrics-sql.test.ts` and `tests/integration/metrics.test.ts` check the file.

## Limitations

From `mvp-scope.md` §6:
- **M3:** the users table keeps only the current consent choice. A student who changed their choice after onboarding is counted with the new choice. In the pilot, changes are expected to be rare; if needed, a `consent_changed` event would keep the full history.
- **M7:** a student who receives an offer and stops using Trilho counts as not retained, although this is the product working. These cases will be reported separately.
- **Deleted accounts (all metrics):** when a student deletes their account (US08), all their data, including product events, is deleted. Metrics only cover existing accounts. This is required by GDPR and accepted.

Found while writing the queries:
- **M1 includes network time.** Both timestamps are set by the server when each request arrives, so M1 includes the time to send the form, not only the student's typing time. The difference is small (well under a second) next to a 30 s target.
- **M1/M2 ignore saves without an "opened" event.** If the browser never sends `application_form_opened` (e.g. JavaScript blocked or the request failed), the save has no matching session and is left out of both metrics.
- **M4b matching rule.** Outcome events only store the application id, not the reminder. Each outcome is matched to the latest `reminder_triggered` of the same application at or before it. This is exact under the current rules (an outcome can only be set on the reminder of the current quiet period, R12). Outcomes with no matching trigger would appear as `unmatched`.
- **M6/M7 lose deleted applications.** When a student deletes an application (US04), its row and status history are gone, so it no longer counts towards activation or retention. Product events survive (only the application link is cleared), so this could be recovered from `application_created` events if it becomes a problem.
- **M6/M7 windows are exact multiples of 24 hours** from the registration timestamp, not Lisbon calendar days.
- **M3 per week** groups by the Monday of the registration week in Europe/Lisbon. Weekly cohorts in the pilot will be small, so weekly rates move a lot.
- **Time-dependent results.** M6 and M7 use `now()`, so their denominators grow as accounts age; re-running later gives different values on the same data.
