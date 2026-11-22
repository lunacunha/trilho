// Loads .env* files for scripts that run outside Next.js (drizzle-kit, seed, metrics, tests).
//
// - ENV_FILE set (e.g. `ENV_FILE=.env.prod.local npm run db:migrate`): load ONLY that file.
//   There is no fallback to .env.local, so a missing variable fails instead of silently
//   using a dev value. Variables already set in the shell win.
// - Otherwise: Next.js's own loader in development mode (.env.development.local, .env.local,
//   .env.development, .env), or .env.test when NODE_ENV=test.
//
// Never name the production file `.env.production.local`: `next build` and `next start`
// load that file automatically.
//
// @next/env is CommonJS. drizzle-kit compiles this file to CommonJS (named exports work),
// while `node db/seed.ts` loads it as native ESM (exports only under `default`).
// The namespace import works in both cases.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import * as nextEnvModule from "@next/env";

type NextEnv = typeof nextEnvModule;
const nextEnv: NextEnv =
  "loadEnvConfig" in nextEnvModule
    ? nextEnvModule
    : (nextEnvModule as unknown as { default: NextEnv }).default;

const envFile = process.env.ENV_FILE;

if (envFile) {
  const path = resolve(process.cwd(), envFile);
  if (!existsSync(path)) {
    throw new Error(`ENV_FILE points to a file that does not exist: ${envFile}`);
  }
  process.loadEnvFile(path);
} else {
  nextEnv.loadEnvConfig(process.cwd(), true);
}

/** Prints which database a script is about to use (host only, never the full URL). */
export function printTarget(label: string, url: string | undefined): void {
  const host = url ? new URL(url).host : "(not set)";
  const source = envFile ?? (process.env.NODE_ENV === "test" ? ".env.test" : "default .env files");
  console.log(`${label} database host: ${host} (env: ${source})`);
}
