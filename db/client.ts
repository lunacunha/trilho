// Database client (decision 041, supersedes 032).
//
// On Vercel a WebSocket connection must not outlive a request: the function is frozen between
// requests and a pooled idle socket can be dead when the next request reuses it
// (@neondatabase/serverless README, "Pool and Client"). So:
// - `db` uses the stateless HTTP driver: every normal query and Better Auth.
// - `withTransaction` opens a WebSocket Pool for one interactive transaction and closes it after.
//   It is the only way to run a transaction: the HTTP driver does not support them.
import { neon, Pool } from "@neondatabase/serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

export const db = drizzleHttp({ client: neon(connectionString), schema });
export type Database = typeof db;

type TransactionRunner = NeonDatabase<typeof schema>["transaction"];
export type Transaction = Parameters<Parameters<TransactionRunner>[0]>[0];
export type TransactionConfig = Parameters<TransactionRunner>[1];

/** Either `db` or a transaction: what helpers that run inside or outside a transaction accept. */
export type Executor = PgDatabase<PgQueryResultHKT, typeof schema>;

function logPoolError(error: unknown): void {
  console.error("Database pool error:", error instanceof Error ? error.message : error);
}

/**
 * Runs `fn` in one interactive transaction (BEGIN … COMMIT, ROLLBACK if it throws) on a
 * dedicated WebSocket connection that is opened for this call and closed afterwards.
 */
export async function withTransaction<T>(
  fn: (tx: Transaction) => Promise<T>,
  config?: TransactionConfig,
): Promise<T> {
  const pool = new Pool({ connectionString });
  // An error on an idle client must not crash the process
  pool.on("error", logPoolError);
  try {
    return await drizzleWs({ client: pool, schema }).transaction(fn, config);
  } finally {
    // A failure while closing must not turn a committed transaction into an error
    await pool.end().catch(logPoolError);
  }
}
