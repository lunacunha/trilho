// Minimal Better Auth configuration: tables, email + password and Trilho's user fields.
// Email verification, the @up.pt domain check and routes come with US01.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      // input: false → cannot be set through sign-up; only services change these
      role: {
        type: ["student", "career_service"],
        required: false,
        defaultValue: "student",
        input: false,
      },
      consent: { type: "boolean", required: false, input: false },
      consentUpdatedAt: { type: "date", required: false, input: false },
      emailVerifiedAt: { type: "date", required: false, input: false },
    },
  },
});

export type Auth = typeof auth;
