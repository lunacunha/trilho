// Loads .env* files for scripts that run outside Next.js (drizzle-kit, seed).
// Next.js loads them itself; this mirrors its behaviour (.env.local in dev, .env.test in tests).
//
// @next/env is CommonJS. drizzle-kit compiles this file to CommonJS (named exports work),
// while `node db/seed.ts` loads it as native ESM (exports only under `default`).
// The namespace import works in both cases.
import * as nextEnvModule from "@next/env";

type NextEnv = typeof nextEnvModule;
const nextEnv: NextEnv =
  "loadEnvConfig" in nextEnvModule
    ? nextEnvModule
    : (nextEnvModule as unknown as { default: NextEnv }).default;

nextEnv.loadEnvConfig(process.cwd());
