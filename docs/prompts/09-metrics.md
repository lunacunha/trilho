# Prompt 09 — Instrumentation: metrics M1–M7

## Goal
Show that the product events and tables already recorded are enough to compute metrics M1–M7 (plus M4b), and document each metric with its hypothesis and decision rule.

## Read first
- `docs/product/mvp-scope.md`: hypotheses H1–H3 (§5) and metrics M1–M7 + M4b, with their Definitions and Limitations (§6). **These definitions are final: use them exactly.**
- `SPEC.md` §9 (product events and their fields) and R9 (active student)
- `db/schema.ts`, `lib/services/events.ts`, `db/seed.ts`
- `docs/product/queries.sql` (style to follow)

## Deliverables
1. `docs/product/metrics.sql`: one query per metric (M1, M2, M3, M4, M4b, M5, M6, M7), plain PostgreSQL, SELECT only. Each query starts with a comment: metric id, name, formula. Rates as percentages with 1 decimal place; medians with `percentile_cont(0.5)`. M3 returns the overall rate and the rate per registration week. M6 and M7 also return numerator and denominator.
2. `scripts/metrics.ts` + `npm run metrics`: runs every query in `metrics.sql` against the database in `.env.local`, inside a READ ONLY transaction, and prints a small table per metric. Use the existing db client and the same way `db/seed.ts` loads env; no new dependencies.
3. `docs/product/metrics.md`:
   - one table: Metric | Definition | Events / tables used | Hypothesis | Target | Result on seed data (22 Nov) | Decision rule;
   - a short "How to run" section (`npm run metrics`);
   - the Limitations from mvp-scope §6, plus any you find;
   - a note: "Seed results validate the queries, not the hypotheses. Real values come from the pilot (Phase 9)."

## Rules
- Do not change the schema, the events or any service. If a metric cannot be computed from the recorded data, stop and tell me which event or field is missing. Do not invent a workaround.
- You may run `npm run metrics` against dev: read-only queries only. Do not run db:seed, sign-ups, inserts, updates or deletes on dev.
- Do not edit `docs/product/mvp-scope.md` or `SPEC.md`. If a definition still seems ambiguous, pick the most literal reading and list it under "Open questions" in your report.
- If the seed cannot show a meaningful value for a metric (e.g. M7 needs accounts older than 28 days, or seed users have no form sessions), say so in the report. Do not change the seed.
- Never print emails, names or user ids in the script output: aggregates only.
- Do not commit.

## Report
- The value of each metric on dev, with numerator and denominator, and whether it looks plausible for the seed.
- Open questions about definitions.
- A manual check for me: open the new-application form, save an application, run `npm run metrics`, and confirm the M1/M2 counts went up by one session.