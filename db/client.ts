// Database client. Uses the WebSocket Pool driver (not neon-http) because
// services need interactive transactions. Node 22+ provides a global WebSocket.
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
export type Database = typeof db;
