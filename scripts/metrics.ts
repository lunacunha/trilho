// Prints product metrics M1–M7 + M4b (docs/product/metrics.md).
// Run with `npm run metrics` (uses .env.local → Neon branch `dev`; ENV_FILE=<file> to target another).
// Every query runs inside one READ ONLY transaction, which is rolled back at the end.
// Queries return aggregates only: no ids, names or emails are printed.

import { printTarget } from "../db/env.ts";
import { readFileSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";
import { parseMetricsSql } from "./metrics-sql.ts";

const SQL_FILE = new URL("../docs/product/metrics.sql", import.meta.url);

async function main() {
  const queries = parseMetricsSql(readFileSync(SQL_FILE, "utf8"));
  printTarget("Metrics", process.env.DATABASE_URL);
  console.log(`Run at: ${new Date().toISOString()} (read-only)\n`);

  // A long-running script, so a Pool is fine here (the app uses db/client.ts instead)
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set.");
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    for (const q of queries) {
      const result = await client.query(q.sql);
      console.log(`${q.id} — ${q.title}`);
      console.table(result.rows);
      console.log();
    }
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Metrics failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
