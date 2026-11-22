# Trilho

A shared job-application tracker for FEUP master's students. Students track their applications in a personal pipeline and see anonymous company response times built from the data of students who consent. The FEUP Career Service gets an aggregated, privacy-thresholded dashboard.

MVP for the Information Systems Architecture course (MESG, FEUP).

**Live:** `https://<production-url>` _(to be filled in after deployment)_

> **Demo access:** demo credentials (a student and a Career Service account) are shared separately with the teaching team. **All data in the app is fictional**: companies, people and applications come from a seed script.

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · Drizzle ORM + drizzle-kit · Neon Postgres (`@neondatabase/serverless`) · Better Auth · Zod · Nodemailer (Gmail SMTP) · Chart.js · Vitest · Vercel.

## Run locally

Requirements: Node.js 22.18+ (scripts run TypeScript directly with Node), npm, and access to a Neon project with `dev` and `test` branches.

```bash
npm install
cp .env.example .env.local    # fill in the values for the Neon `dev` branch
cp .env.example .env.test     # fill in the values for the Neon `test` branch
npm run db:migrate            # create tables on dev
npm run db:migrate:test       # create tables on test
npm run db:seed               # load fictional demo data on dev
npm run dev                   # http://localhost:3000
```

Leave `SMTP_USER` empty in `.env.local`: the verification link is then printed in the dev server log instead of being emailed.

Environment variables are documented in [`.env.example`](.env.example). Scripts can target another env file with `ENV_FILE=<file>` (see [`docs/deploy.md`](docs/deploy.md)).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server (`.env.local`, Neon `dev`) |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm test` | All tests (`.env.test`, Neon `test`) |
| `npm run test:unit` / `npm run test:integration` | Only unit / only integration tests |
| `npm run db:generate` | Generate a migration from `db/schema.ts` |
| `npm run db:migrate` | Apply migrations (`db:migrate:test` for the test branch) |
| `npm run db:seed` | Reset and load fictional demo data (refuses if real users exist) |
| `npm run metrics` | Print product metrics M1–M7 (read-only) |

## Tests

- **Unit** (`tests/unit/`): business rules R1–R12 as pure functions, using the numeric examples from `SPEC.md`, plus validation and access rules.
- **Integration** (`tests/integration/`): services against a real Postgres (Neon `test` branch only), covering ownership, consent, privacy thresholds, transactions and product events.
- Test names start with the scenario or rule ID (e.g. `US02-6: …`, `R2: …`). The full map from SPEC to tests is in [`docs/testing/traceability.md`](docs/testing/traceability.md).

## Folder structure

```
app/              Pages, Server Actions and Route Handlers (UI + entry layer)
  api/            auth (Better Auth), companies/suggestions, health
components/       Shared React components
lib/
  services/       Business logic: authorization, transactions, product events
  rules/          Business rules R1–R12 as pure functions
  auth.ts         Better Auth configuration
  email.ts        Verification email (Nodemailer + Gmail)
  validation.ts   Zod schemas for every input
db/
  schema.ts       Drizzle schema (the only place tables change)
  migrations/     Generated SQL migrations
  seed.ts         Fictional demo data (+ seed-guard.ts)
scripts/          metrics
tests/            unit/ and integration/
docs/             Architecture, decisions, product, testing, UX
proxy.ts          Redirects visitors without a session to /login
```

Layers: UI → entry (Server Actions, Route Handlers) → services → data. Only services touch the database; see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Documentation

| Document | Contents |
|---|---|
| [`SPEC.md`](SPEC.md) | User stories, acceptance scenarios, business rules R1–R12, events |
| [`CLAUDE.md`](CLAUDE.md) | Working rules for the AI coding assistant used to build Trilho |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Layers, folders, request flows |
| [`docs/data-model.md`](docs/data-model.md) | Tables and relationships |
| [`docs/decisions.md`](docs/decisions.md) | Decision log |
| [`docs/prompts/`](docs/prompts/) | The prompts used to build each slice |
| [`docs/testing/traceability.md`](docs/testing/traceability.md) | SPEC scenarios → automated tests |
| [`docs/product/mvp-scope.md`](docs/product/mvp-scope.md) | What is in and out of the MVP |
| [`docs/product/metrics.md`](docs/product/metrics.md) | Product metrics M1–M7 |
| [`docs/ux-review.md`](docs/ux-review.md) | UX and accessibility review |
| [`docs/usability-test-plan.md`](docs/usability-test-plan.md) | Usability test plan |
| [`docs/deploy.md`](docs/deploy.md) | Production deploy runbook |
