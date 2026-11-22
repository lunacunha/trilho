# Trilho — project status and decisions

_Last updated: 2026-11-22 (Phase 5, slice 06 / US06+US05 implemented)_

## Deadline
- Assignment 2 deadline: **23 Nov 2026, 08:00** → work must be finished on **22 Nov**.
- The user manages her own time. Phases stay as planned; she reviews every phase. **At the start of each phase, state what is optional for the MVP.** Do not propose re-plans unless asked.

## Status
- **Phase 0 — DONE (13 Nov).** `/api/health` on Vercel returns ok from Neon.
- **Phase 1 — DONE (15 Nov).** `docs/product/mvp-scope.md`. US16 (edit account name) added to Out of scope on 21 Nov.
- **Phase 2 — DONE (15 Nov).** `SPEC.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`, `docs/decisions.md` (001–033), `.env.example`.
- **Phase 3 — DONE (19–20 Nov).** Schema, migration, seed, `docs/data-model.md`, `docs/product/queries.sql`.
- **Phase 4 — DONE (21 Nov).** 171 tests (red phase), `docs/testing/traceability.md`.
- **Phase 5 — in progress.** Prompts 03–08 in `docs/prompts/`.
  - **Slice 03 (US01) — DONE 21 Nov.** Gmail SMTP (`trilho.demo@gmail.com`) delivers to @up.pt inbox.
  - **Slice 04 (US02+US03) — DONE 22 Nov 00:20.** All 7 manual checks passed. **H1 first data point: logging one application took < 30 s** (user's own test). Form-opened event recorded client-side (no prefetch phantom events). Cards ordered newest first.
  - **Slice 06 (US06+US05) — implemented 22 Nov, awaiting manual check.** Company page `/companies/[id]` (R1–R3), pipeline reminders (R4/R12) with Follow-up done / Dismiss. A shown reminder stays until the student reacts, even if the median changes (R12, SPEC updated 22 Nov).
  - Slice 05 (US04) — committed (6a19fe5); this file was not updated for it.
  - Next: slice 07 (dashboard).
- User's choices for Phase 5: all 8 Must stories + dashboard chart + company suggestions; real email kept.

## TO DO LATER (remind the user — she asked to keep track)
1. **Fix her own account name on `dev`**: `UPDATE "user" SET name = 'Luna Cunha' WHERE email = '<her up.pt email>';` (Neon SQL Editor). Postponed.
2. **US01-3 manual test** (log in before verifying) → in slice 08, after deleting and re-registering her account.
3. **US16 edit name** → only if time in slice 08.
4. **Phase 7 — top UX issue: low contrast.** Column headings ("Sent (3)"), company names on pipeline cards, and form placeholders ("Choose a sector", date) are light grey on light/white backgrounds → nearly invisible. Likely cause: create-next-app dark-mode colours (`prefers-color-scheme: dark` in globals.css) switch text to light while cards keep a fixed white background. Fails SPEC §11 (WCAG AA). Screenshots from 22 Nov 00:18–00:20 = "before" images for `docs/ux-review.md`.
5. **SPEC lines to confirm were added:** US03-2 "Within each column, cards are ordered by date sent, newest first." and §12 email question answered ("Tested on 21 Nov: delivered to the inbox"). §9 form_opened "When" already updated.
6. **Rosetta warning**: Node is x86-64 under Rosetta (`node -p process.arch`). Not blocking; fix after delivery.
7. **After each slice**: check Gmail "Sent" folder of `trilho.demo@gmail.com` (only her own verification emails).
8. **Phase 8**: migrate + seed `production`; Vercel env vars (`BETTER_AUTH_SECRET` new value, `BETTER_AUTH_URL` = prod URL, `SMTP_USER`, `SMTP_PASSWORD`); `/api/health` → `"database":"up"`; live URL currently errors on new pages (expected until then).
9. **Phase 6 (instrumentation)**: events already recorded by services; write the metric SQL queries (M1–M7) on seed data.
10. **Next.js agent-feedback form** opened in her browser by the agent (AGENTS.md) — nothing sent; can be closed/ignored.

## Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16.4.6 (App Router, no `src/`, `proxy.ts`, cacheComponents) + TypeScript + Tailwind |
| Hosting | Vercel Hobby, functions `fra1`; only `DATABASE_URL` set (Production) |
| Database | Neon Postgres 18, Frankfurt, DB `trilho`. Branches `production` (no tables yet), `dev` (`.env.local`), `test` (`.env.test`) |
| DB client | `drizzle-orm/neon-serverless` with `Pool` |
| Auth | Better Auth; domain hook `databaseHooks.user.create.before`; `requireEmailVerification`; `lib/session.ts` |
| Email | Nodemailer + Gmail SMTP |
| Tests | Vitest (unit + integration) — after slice 04: 94/196 passing, rest expected red |
| Local | Node 25 (x86 under Rosetta), macOS, Claude Code CLI; dev on port 3000 |

## Seed facts (useful for demo)
- Accounts: `careers@fe.up.pt` (career_service), `demo@up.pt` (demo student, consent true), `demo.student01..25@up.pt`. Password = `SEED_PASSWORD`.
- Companies with statistic: Lumen Energy (15 d), Northwind (11), Douro Software (25), Brisa Bank (30), Atlântico Retail (8). <5 applications: Cávado Analytics, Ribeira Foods, Gaia Engineering.
- Demo account: Lumen reminder, Ferro 14-day reminder, Mar Telecom R5 case (now No response), no reminder on Brisa or Atlântico.

## Key rules added during build
- CLAUDE.md Security: never use real-looking emails in tests/seeds/smoke tests.
- Don't reveal account existence on sign-up or resend.
- Product events must not be recorded on prefetch/server render (data quality for M1/M2).

## Coaching rules
- End of each phase: short summary of how the phase's concepts connect.
- Ready-to-paste English markdown for deliverables when asked.
- Optional-for-MVP list at the start of each phase.
- Tell the user when to `/clear` (after each commit, before the next prompt).
- Review each Claude Code plan with her before approval.