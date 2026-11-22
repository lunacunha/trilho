# Trilho — project status and decisions

_Last updated: 2026-11-22 02:00 (Phase 5 DONE — next: Phase 6)_

## Deadline
- Assignment 2 deadline: **23 Nov 2026, 08:00** → work must be finished on **22 Nov**.
- The user manages her own time. Phases stay as planned; she reviews every phase. **At the start of each phase, state what is optional for the MVP.** Do not propose re-plans unless asked.

## Status
- **Phase 0 — DONE (13 Nov).** `/api/health` on Vercel returns ok from Neon.
- **Phase 1 — DONE (15 Nov).** `docs/product/mvp-scope.md`. US16 (edit account name) in Out of scope.
- **Phase 2 — DONE (15 Nov).** `SPEC.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`, `docs/decisions.md`, `.env.example`.
- **Phase 3 — DONE (19–20 Nov).** Schema, migration, seed, `docs/data-model.md`, `docs/product/queries.sql`.
- **Phase 4 — DONE (21 Nov).** Red-phase tests, `docs/testing/traceability.md`.
- **Phase 5 — DONE (22 Nov ~02:00).** Slices 03–08 (US01–US08) committed. **225/225 tests pass**, lint + build clean.
  - Slice 04: H1 first data point — logging one application took < 30 s.
  - Slice 07: dashboard matches Q2. Median time to first reply needs ≥ 5 replied applications (decision 041). Demo story: Career Fair 58% reply rate vs LinkedIn Easy Apply 35% (fictional data — always say so).
  - Slice 08: privacy page (consent toggle + delete account), `/account-deleted`. Only students can delete (decision 042). Seed fix: `lib/services/errors.ts` parameter property removed; `"erasableSyntaxOnly": true` in tsconfig.
  - Manual checks done: US01-3 (log in before verifying → "Verify your email first"), account deleted and re-registered with the name "Luna Cunha"; account survives `db:seed`.
  - Phase 5 concepts summary given.
- **Next: Phase 6 (instrumentation)** — give optional list first; metric SQL queries M1–M7 on seed data (events already recorded).

## TO DO LATER (remind the user — she asked to keep track)
1. **Phase 7 — top UX issue: low contrast.** Root cause confirmed in DevTools: `globals.css` body uses `var(--background)/var(--foreground)`, and the create-next-app `@media (prefers-color-scheme: dark)` block turns text light (her Mac is in dark mode) while cards keep a white background. Affects column headings, company names on cards, placeholders, Follow-up done/Dismiss buttons, grey subtitles, blue links on black. Fix: remove the dark block or fix light colours. Screenshots from 22 Nov = "before" images for `docs/ux-review.md`.
2. **Next.js dev indicator** ("N" bubble) overlaps content at 375 px — dev only, ignore.
3. **Browser Back after deleting the account** may show a cached page (bfcache); refresh goes to login. Acceptable for MVP; can mention in limitations.
4. **Rosetta warning**: Node is x86-64 under Rosetta. Not blocking; fix after delivery.
5. **After each slice/phase**: check Gmail "Sent" of `trilho.demo@gmail.com` (only her own verification emails).
6. **Phase 8**: migrate + seed `production`; Vercel env vars (new `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` = prod URL, `SMTP_USER`, `SMTP_PASSWORD`); `/api/health` → `"database":"up"`; PDF (data tables, ER diagram, screenshots), demo script with fictional-data disclaimers, rehearsal.
7. **Next.js agent-feedback form** opened by the agent — nothing sent; ignore.

## Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16.4.6 (App Router, no `src/`, `proxy.ts`, cacheComponents) + TypeScript (strict, `erasableSyntaxOnly`) + Tailwind |
| Hosting | Vercel Hobby, functions `fra1`; only `DATABASE_URL` set (Production) |
| Database | Neon Postgres 18, Frankfurt, DB `trilho`. Branches `production` (no tables yet), `dev` (`.env.local`), `test` (`.env.test`) |
| DB client | `drizzle-orm/neon-serverless` with `Pool` |
| Auth | Better Auth; domain hook; `requireEmailVerification`; `lib/session.ts` |
| Email | Nodemailer + Gmail SMTP |
| Tests | Vitest (unit + integration) — 225/225 |
| Local | Node 25 (x86 under Rosetta), macOS, Claude Code CLI; dev on port 3000 |

## Seed facts (useful for demo)
- Accounts: `careers@fe.up.pt` (career_service), `demo@up.pt` (demo student, consent true), `demo.student01..25@up.pt`. Password = `SEED_PASSWORD`.
- Companies with statistic: Lumen Energy (15 d), Northwind (11), Douro Software (25), Brisa Bank (30), Atlântico Retail (8). <5 applications: Cávado Analytics, Ribeira Foods, Gaia Engineering.
- Dashboard (dev, 22 Nov): 19 active students (of 21 consenting), median 14 days; Career Fair 26 apps / 58%.

## Key rules added during build
- CLAUDE.md Security: never use real-looking emails in tests/seeds/smoke tests.
- Agent memory: never seed, sign up or delete accounts on dev itself.
- Don't reveal account existence on sign-up or resend.
- Product events not recorded on prefetch/server render.
- Never run `npm test` while the agent is running tests (shared test branch).

## Coaching rules
- End of each phase: short summary of how the phase's concepts connect.
- Ready-to-paste English markdown for deliverables when asked.
- Optional-for-MVP list at the start of each phase.
- Tell the user when to `/clear` (after each commit, before the next prompt).
- Review each Claude Code plan with her before approval.