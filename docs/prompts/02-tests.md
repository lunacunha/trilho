# Prompt 02 — Tests from the spec (red phase)

## Goal
Write the automated tests for every business rule and the critical flows in SPEC.md, **before** the implementation. At the end, the tests exist and fail for the right reason ("Not implemented").

## Context
Read first: `CLAUDE.md` (testing rules), `SPEC.md` (§6 rules R1–R12, §7 scenarios, §10 validation), `docs/ARCHITECTURE.md` (§3 layers, §4 folders, §5 request flows, §9 testing strategy), `docs/data-model.md`.

## Scope
**In:**
- Install `vitest` (approved). Add `vitest.config.ts` and scripts: `test` (all), `test:unit`, `test:integration`, and `db:migrate:test` (migrate the `test` branch using `.env.test`).
- Run `db:migrate:test` once, so the `test` branch has the schema.
- **Stubs:** create the functions the tests need in `lib/rules/`, `lib/validation.ts` and `lib/services/`, with types and signatures only. Every body throws `new Error("Not implemented")`. Exception: `lib/rules/company-name.ts` already exists (its tests may pass now).
- **Unit tests** (`tests/unit/`): every rule R1–R12 and the validation rules (SPEC §10, US01-2 email domain, US02-2/3/7, US04-3), using the numeric examples from SPEC.md, plus boundary cases (e.g. R4: 17 days → reminder, 16 → none; R5: 60 → convert, 59 → not; R4 median 16.5 → threshold 17).
- **Integration tests** (`tests/integration/`), against the `test` branch, for the critical flows:
  - US03-3: a student cannot read, update or delete another student's application ("Not found").
  - US07-1: a student cannot get the dashboard data ("Access denied").
  - US06-4 / US07-3: applications of non-consenting students are excluded from company statistics and dashboard numbers.
  - US08-3: deleting an account deletes applications, status history, reminders and product events.
  - US02-1 / US02-6: creating an application stores the initial status change and links a differently spelled company to the existing one.
  - US04-6: loading the pipeline applies R5 with the backdated date.
  - R12: only one reminder per quiet period.
- `docs/testing/traceability.md`: a table with every scenario ID (SPEC §7) and rule ID (SPEC §6) → test file and test name, or "manual" / "not covered" with a reason.

**Out (do not do):**
- Do not implement any logic. Stubs only throw "Not implemented".
- No pages, components, Server Actions or Route Handlers.
- No Playwright or other browser tests.
- Do not run anything against `dev` or `production`.

## Decisions already made
- Test names start with the ID: `it("R2: median 17 days → '2–3 weeks'", ...)`, `it("US03-3: student B cannot read A's application", ...)`.
- Rules receive "today" as a parameter; tests use fixed dates (e.g. today = 2026-11-15).
- Integration tests: each test file starts from empty Trilho tables and creates small, explicit fixtures (e.g. 2 students, 1 company). Users can be inserted directly into the `user` table (no sign-up needed). Do not use `db/seed.ts`.
- Integration tests run one file at a time (no parallel files), to avoid interfering with each other.
- Safety: the integration setup refuses to run unless `NODE_ENV` is `test`, and prints the database host first.
- In this phase only, tests are expected to fail. The Definition of done in CLAUDE.md applies to `lint` and `build`; `npm test` must fail **only** with "Not implemented".
- If a SPEC example leaves a boundary or behaviour undefined, list it in the plan and ask; do not invent a rule.

## Done when
- `npm run db:migrate:test` has applied the schema to the `test` branch.
- `npm test` runs every test; all failures are "Not implemented" (no import, type or syntax errors). Report: number of tests, passing, failing.
- `npm run lint` and `npm run build` pass.
- `docs/testing/traceability.md` covers every scenario and rule ID.

## Process
Propose a plan first and wait for my approval. In the plan, list the service functions and their signatures (the stubs), and any SPEC ambiguities you found. At the end, report: files created or changed, test counts, ambiguities, and open questions.