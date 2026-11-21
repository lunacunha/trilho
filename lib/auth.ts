// Better Auth configuration (US01): email + password, verified @up.pt / @fe.up.pt emails only.
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import { sendVerificationEmail } from "./email.ts";
import { isAllowedEmailDomain } from "./rules/email-domain.ts";
import { recordEmailVerified } from "./services/accounts.ts";
import { EMAIL_DOMAIN_MESSAGE } from "./validation.ts";

/** Where the verification link lands; "/" routes by role and consent. */
export const AFTER_VERIFICATION_URL = "/";

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
    // US01-3: no session until the email is verified
    requireEmailVerification: true,
    // With requireEmailVerification, Better Auth answers a duplicate sign-up exactly like a
    // new one, so the page never reveals that someone has an account. Here we only resend
    // the link when that account is still unverified.
    onExistingUserSignUp: async ({ user }) => {
      console.info(
        `Sign-up attempt for an existing account (user ${user.id}, verified=${user.emailVerified})`,
      );
      if (user.emailVerified) return;
      await auth.api.sendVerificationEmail({
        body: { email: user.email, callbackURL: AFTER_VERIFICATION_URL },
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
    afterEmailVerification: async (user) => {
      await recordEmailVerified(user.id, new Date());
    },
  },
  databaseHooks: {
    user: {
      create: {
        // US01-2 on the server: no account outside the allowed domains, whatever the client sends
        before: async (user) => {
          if (!isAllowedEmailDomain(user.email)) {
            throw new APIError("BAD_REQUEST", { message: EMAIL_DOMAIN_MESSAGE });
          }
        },
      },
    },
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
  // Must be last: lets Server Actions set the session cookie
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
