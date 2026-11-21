# Prompt 03 — Slice US01: register, verify, log in, consent, route protection

## Goal
Make US01 work end to end: a student registers with a University of Porto email, verifies it, logs in, answers the consent question, and every page is protected according to role and consent.

## Context
Read first: `CLAUDE.md`, `SPEC.md` (§3 roles, US01, §8 routes, §10 errors, §11 non-functional), `docs/ARCHITECTURE.md` (§3 layers, §5 request flows, §6 auth), the stubs in `lib/rules/access.ts`, `lib/validation.ts` (registration) and `lib/services/consent.ts`, and their tests in `tests/`.

## Scope
**In:**
- `lib/auth.ts`: email + password with `requireEmailVerification`. The verification email is sent with Nodemailer through Gmail SMTP (`SMTP_USER`, `SMTP_PASSWORD`). **In development only**, if `SMTP_USER` is not set, print the verification link to the server log instead of sending. Never do this in production. `afterEmailVerification` sets `email_verified_at`. Install `nodemailer` and `@types/nodemailer` (approved).
- **Domain restriction on the server**, inside Better Auth (not only in the form): only `@up.pt` and `@fe.up.pt`, exact domains, case-insensitive (US01-2). Reuse the same check as `registrationSchema`, so the rule lives in one place.
- `app/api/auth/[...all]` route.
- Pages: `/register`, `/login`, `/verify-email` ("Check your inbox to verify your email" + resend), `/onboarding/consent` (two options, none pre-selected, calls `setConsent`), an "Access denied" page, and **placeholders** for `/pipeline` and `/admin/overview` (a heading only) so the redirects work.
- Route protection using `routeAccess` (`lib/rules/access.ts`): not logged in → `/login`; student without consent → `/onboarding/consent`; student opening `/admin/*` → "Access denied"; `career_service` opening a student page → `/admin/overview`. `/` redirects to the right place.
- A minimal layout: app name, nav (student: Pipeline, Privacy; Career Service: Dashboard) and "Sign out". Tailwind, every input with a label, keyboard-friendly.
- Implement: `routeAccess`, `registrationSchema`, the email domain check, and `setConsent` (sets `consent` and `consent_updated_at`).

**Out (do not do):**
- No applications, pipeline content, company pages or dashboard content.
- No password reset, social login or SSO.
- No visual polish beyond clean defaults (Phase 7).
- Do not change Vercel settings or touch the `production` database.

## Decisions already made
- Exact messages from SPEC: "Use your University of Porto email (@up.pt or @fe.up.pt)", "Check your inbox to verify your email", "Verify your email first".
- `role` and `consent` can never be set from the client (`input: false` already in `lib/auth.ts`).
- Sessions use Better Auth's cookies. The session is read in the entry layer (pages, Server Actions); services receive a `CurrentUser`.
- "Today" in the entry layer comes from `lisbonToday(new Date())`.

## Done when
- The unit tests for `routeAccess`, registration validation (US01-2) and the domain check pass. Other tests may still fail, but only with "Not implemented".
- `npm run lint` and `npm run build` pass.
- The report includes this manual check list, which I will run in the browser:
  1. Register with `ana@gmail.com` → domain error, no account created.
  2. Register with my `@up.pt` email → "Check your inbox to verify your email".
  3. Log in before verifying → "Verify your email first".
  4. Open the verification link → email verified → consent screen with nothing pre-selected.
  5. Choose an option → pipeline placeholder. Log out and log in again → straight to the pipeline (US01-7).
  6. `demo@up.pt` (seed) → pipeline placeholder. `careers@fe.up.pt` → dashboard placeholder.
  7. As a student, open `/admin/overview` → "Access denied".

## Process
Propose a plan first and wait for my approval. At the end, report: files changed, tests now passing, the manual check list, and open questions.