# Deploy runbook — Trilho to production

Vercel (functions in `fra1`) + Neon branch `production` (Frankfurt). Follow the steps in order. Every command runs on your machine from the repository root.

> **Safety rules**
> - The production file is **`.env.prod.local`**, never `.env.production.local`. Next.js loads `.env.production.local` automatically in `next build` / `next start`. `.env.prod.local` is only ever read when you pass `ENV_FILE=.env.prod.local`.
> - With `ENV_FILE` set, scripts load **only** that file (no fallback to `.env.local`).
> - Every script prints `… database host: <host> (env: <file>)` first. **Read it before you go on.** If it is not the production host, press Ctrl+C.
> - `.env*` files are gitignored (`.gitignore`: `.env*`, `!.env.example`). Never commit them.

## 1. Get the Neon production URLs

1. Neon console → project Trilho → branch **`production`** → **Connect**.
2. Copy two connection strings:
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **Direct** (toggle "Connection pooling" off) → `DATABASE_URL_UNPOOLED`

## 2. Create `.env.prod.local`

```bash
cp .env.example .env.prod.local
git check-ignore .env.prod.local   # must print the file name (ignored)
```

Fill in for production:

| Name | Value |
|---|---|
| `DATABASE_URL` | pooled URL from step 1 |
| `DATABASE_URL_UNPOOLED` | direct URL from step 1 |
| `SEED_PASSWORD` | a **new**, strong password (step 4), not the one used on `dev` |

The other variables are not needed for migrate/seed and can stay empty in this file.

## 3. Migrate

```bash
ENV_FILE=.env.prod.local npm run db:migrate
```

Check the first line says `drizzle-kit database host: <production host>`. drizzle-kit applies every migration in `db/migrations/` that has not run yet.

## 4. Seed (fictional demo data)

Generate a strong seed password and put it in `SEED_PASSWORD` in `.env.prod.local`:

```bash
openssl rand -base64 18
```

```bash
ENV_FILE=.env.prod.local npm run db:seed
```

- The first line must be `Seed database host: <production host>`.
- The seed **refuses to run** if the database has any account that is not a seed account (`db/seed-guard.ts`). On a fresh production branch it runs. Once real people have registered, it can never run again on production. That is intended: the seed deletes all data.
- The seed creates the demo accounts (`demo@up.pt`, `careers@fe.up.pt`, `demo.studentNN@up.pt`). All of them use `SEED_PASSWORD`. Share the demo credentials with the teachers separately, never in the repository.

## 5. Generate a new `BETTER_AUTH_SECRET`

```bash
openssl rand -base64 32
```

Use a value only for production. Do not reuse the dev or test secret. If it ever changes, every user is logged out.

## 6. Vercel environment variables

Vercel → project → Settings → Environment Variables. Enter the values by hand (decision 008). Do not import a `.env` file.

| Name | Production | Preview | Development | Value |
|---|---|---|---|---|
| `DATABASE_URL` | ✅ | ❌ | ❌ | pooled production URL |
| `BETTER_AUTH_SECRET` | ✅ | ❌ | ❌ | from step 5 |
| `BETTER_AUTH_URL` | ✅ | ❌ | ❌ | `https://<your-production-domain>`: https, **no trailing slash** |
| `SMTP_USER` | ✅ | ❌ | ❌ | Gmail address that sends the emails |
| `SMTP_PASSWORD` | ✅ | ❌ | ❌ | Gmail **app password** for that address |

**Not in Vercel:** `DATABASE_URL_UNPOOLED` (migrations run from your machine), `SEED_PASSWORD` (seed only), `ENV_FILE` (scripts only). If the Neon–Vercel integration adds extra variables (e.g. `DATABASE_URL_UNPOOLED`, `PG*`), check that they are scoped to Production only, or remove them.

### Preview deployments: no database

**Preview gets no database variables, and Preview must never point at the production database.** Branch and PR previews may therefore fail to build or show errors on pages that need the database. That is expected and acceptable for this MVP.

### Why `BETTER_AUTH_URL` matters

Better Auth reads it from the environment. It is used for:
- the link in the verification email;
- the trusted origin (requests from other origins are refused);
- secure cookies: with an `https://` URL, cookies get the `__Secure-` prefix and the `Secure` flag.

If it is wrong (e.g. `http://localhost:3000` or the `*.vercel.app` preview URL), verification links point to the wrong place and login can fail.

## 7. Redeploy

Environment variable changes apply only to new deployments: Vercel → Deployments → latest Production deployment → **Redeploy**. Pushing to `main` also deploys.

## 8. Checks

Do these on the production URL, in a private window.

1. **Health:** `https://<domain>/api/health` → `{"status":"ok","database":"PostgreSQL …"}`. `503` means `DATABASE_URL` is missing or wrong.
2. **Register with your own `@up.pt` / `@fe.up.pt` address.** The email arrives, and **the link starts with `https://<your-production-domain>/`** (not localhost, not a preview URL). Open it, verify, answer consent. Then delete this test account in Settings → Privacy if you don't want to keep it.
3. **Demo student:** log in as `demo@up.pt` with `SEED_PASSWORD`. The pipeline shows every column, reminders, and a company page with a statistic.
4. **Career Service:** log in as `careers@fe.up.pt`. Check `/admin/overview`: KPIs, chart, companies below the threshold hidden.
5. **Both themes:** switch light/dark with the theme toggle on a few screens (login, pipeline, dashboard).
6. In the browser dev tools → Application → Cookies, the session cookie is named `__Secure-better-auth.session_token` and is `Secure`.
7. Vercel → Logs: no `Sending the verification email failed` or other errors.

### Known limitation: email failures are silent to the user

Better Auth catches errors from sending the verification email and only logs them. If Gmail is down or rejects the login, sign-up still shows "Check your inbox", and **the user is not told the email failed**. They can use **"Resend verification email"** on the verify-email page. The server log shows `Sending the verification email failed: <reason>`. SMTP connection, greeting and socket timeouts are 10 s each (`lib/email.ts`), so a stalled server fails fast instead of holding the function open.

Other email limits: Gmail sends about 500 emails a day per account. The app password needs 2-Step Verification on that Google account. Emails come from that personal address.

## 9. Roll back

- **App:** Vercel → Deployments → the previous good Production deployment → **Promote to Production** (Instant Rollback). This does not touch the database.
- **Database:** before a risky migration, create a Neon branch from `production` as a backup (Neon console → Branches → Create branch, from `production`, "now"). To roll back, use Neon **Restore** (point-in-time restore of `production` to a time before the migration), or point `DATABASE_URL` at the backup branch and redeploy. Migrations are never edited after they run. A fix is a new migration.
- **Secret leaked:** generate a new `BETTER_AUTH_SECRET` (all sessions end), reset the Neon role password (Neon → Roles → Reset password, then update both URLs), revoke the Gmail app password and create a new one. Update Vercel and redeploy.

## 10. After deploying

- Delete `.env.prod.local` or move it out of the repository folder, so a later command cannot pick it up by mistake.
- Put the live URL in `README.md`.
