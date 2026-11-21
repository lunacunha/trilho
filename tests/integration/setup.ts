// Runs before each integration test file. Loads .env.test and refuses to run anywhere else.
import "../../db/env.ts";
import { afterAll } from "vitest";

if (process.env.NODE_ENV !== "test") {
  throw new Error(`Integration tests require NODE_ENV=test (got "${process.env.NODE_ENV}").`);
}
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Integration tests read it from .env.test.");
}
console.log(`[integration] database host: ${new URL(url).host}`);

afterAll(async () => {
  const { pool } = await import("../../db/client.ts");
  await pool.end();
});
