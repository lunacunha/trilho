// Prints product metrics M1–M7 + M4b (docs/product/metrics.md).
// Run with `npm run metrics` (uses .env.local → Neon branch `dev`).
// Every query runs inside one READ ONLY transaction, which is rolled back at the end.
// Queries return aggregates only: no ids, names or emails are printed.

import "../db/env.ts";
import { readFileSync } from "node:fs";
import { pool } from "../db/client.ts";
import { parseMetricsSql } from "./metrics-sql.ts";

const SQL_FILE = new URL("../docs/product/metrics.sql", import.meta.url);

async function main() {
  const queries = parseMetricsSql(readFileSync(SQL_FILE, "utf8"));
  console.log(`Database host: ${new URL(process.env.DATABASE_URL!).host}`);
  console.log(`Run at: ${new Date().toISOString()} (read-only)\n`);

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
  }
}

main()
  .then(() => pool.end())
  .catch(async (error: unknown) => {
    console.error("Metrics failed:", error instanceof Error ? error.message : error);
    await pool.end();
    process.exit(1);
  });
