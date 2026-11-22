# Prompt 12 — Deploy readiness

## Goal
Prepare everything so that I can deploy Trilho to production myself (Vercel + Neon `production` branch), and make the repository ready for the teachers to read. **You do not touch production.**

## Read first
`package.json`, `db/env.ts`, `db/client.ts`, `drizzle.config.ts`, `db/seed.ts`, `lib/auth.ts`, `lib/email.ts`, `next.config.ts`, `proxy.ts`, `.env.example`, `.gitignore`, `README.md`, `docs/ARCHITECTURE.md`.

## Tasks
1. **Environment variables.** List every variable the app reads, where it is used (build, runtime, scripts) and whether Vercel needs it. Update `.env.example` with names and one-line comments only.
2. **Migrate and seed against another database.** Check how `db/env.ts` loads variables. Make it possible to run `npm run db:migrate` and `npm run db:seed` against production by pointing at a separate gitignored file (e.g. `ENV_FILE=.env.production.local npm run db:migrate`), without editing `.env.local`. Make sure `.gitignore` covers that file. Every script prints the target database host before doing anything.
3. **Seed guard.** The seed must refuse to run if the target database already has any user that is not a seed account, so it can never wipe real users later. Add a test.
4. **Auth in production.** Check that nothing hardcodes `localhost:3000`, that the verification link and trusted origins come from `BETTER_AUTH_URL`, and that cookies are secure in production.
5. **Email in production.** Check that the Nodemailer + Gmail setup works in a Vercel serverless function (timeouts, port) and report any risk.
6. **Secret scan.** Check the full git history for committed secrets: `.env*` files (other than `.env.example`), connection strings, passwords, the Gmail app password, `BETTER_AUTH_SECRET`. Report findings only; do not rewrite history.
7. **`README.md`** (rewrite): what Trilho is (2–3 lines); live URL placeholder; note that demo credentials are shared separately and all data is fictional; stack; how to run locally; scripts; tests; folder structure; links to `SPEC.md`, `CLAUDE.md`, and the docs (`ARCHITECTURE`, `data-model`, `decisions`, `prompts/`, `testing/traceability`, `product/mvp-scope`, `product/metrics`, `ux-review`, `usability-test-plan`).
8. **`docs/deploy.md`**: a step-by-step runbook for me: get the Neon `production` URLs; create `.env.production.local`; migrate; seed (with a new, strong `SEED_PASSWORD`); generate a new `BETTER_AUTH_SECRET`; Vercel environment variables (names and which environment); redeploy; checks (`/api/health`, register with my own email and confirm the link points to the production URL, log in as the demo student, dashboard as Career Service, both themes); how to roll back.

## Rules
- Never connect to the production database. Never read `.env*` files (except `.env.example`).
- No new dependencies. Tests, lint and build must pass. Do not commit.

## Report
Environment variable table; what changed; secret scan result; anything I must decide before deploying.