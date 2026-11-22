# Prompt 13 — Fix stale database connections on Vercel

## Problem (seen in production)
Vercel runtime logs, 22 Nov 16:18, route `/admin/overview`:
`ERROR [Better Auth]: INTERNAL_SERVER_ERROR Error: Failed query: select ... from "session" where "session"."token" = $1`
with `[cause]: ErrorEvent { type: 'error' }` (a WebSocket error, not an SQL error). The function instance had been alive ~3.6 min. The next request worked.

Hypothesis: `db/client.ts` keeps a global `Pool` from `@neondatabase/serverless` (WebSocket). Between requests Vercel freezes the function; on the next request the pool reuses a dead WebSocket and the first query fails. Neon's docs say Pool/Client connections in serverless environments should not outlive a request.

## Goal
No query can fail because of a stale connection, while keeping interactive transactions (`db.transaction`, `SELECT ... FOR UPDATE`, the guarded R5 update) exactly as they are.

## Read first
`db/client.ts`, `lib/auth.ts` (Drizzle adapter), every `db.transaction` call in `lib/services/`, `node_modules/@neondatabase/serverless` README (serverless guidance), the Neon + Drizzle docs in `node_modules/drizzle-orm` if available, and `node_modules/next/dist/docs` if relevant.

## What I want in the plan
1. Confirm or reject the hypothesis from the code and the library docs.
2. Propose the smallest safe fix and compare it with the alternatives, for example:
   - HTTP driver (`drizzle-orm/neon-http`) for normal queries and Better Auth, plus a Pool created and closed **inside** each transaction helper;
   - creating and closing the Pool per request;
   - Vercel's `attachDatabasePool` (would add `@vercel/functions`: only if clearly better, and ask me first);
   - a single retry on connection errors (only as an extra safety net, never for writes that may have run).
3. Show which files change and how transactions keep their guarantees.

## Rules
- No new dependency without asking me.
- All tests, lint and build must pass; the integration tests that use transactions (R5 race, reminders, delete account) must still pass unchanged.
- Never connect to production. Do not read `.env*` files. Do not commit.

## Report
Cause confirmed or not; what changed; how I can verify in production (e.g. wait 5+ minutes idle, then load pages and check the runtime logs for errors).