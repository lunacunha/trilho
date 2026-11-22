import { printTarget } from "./db/env.ts";
import { defineConfig } from "drizzle-kit";

// Migrations use the direct (non-pooled) connection.
const url = process.env.DATABASE_URL_UNPOOLED;
printTarget("drizzle-kit", url);
if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED is not set.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
