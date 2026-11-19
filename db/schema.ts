// Database schema for Trilho. Change tables only here, then run `npm run db:generate`.
// Column names are snake_case in Postgres; TypeScript keys are camelCase.
// The Better Auth tables (user, session, account, verification) keep Better Auth's
// own field names and text ids so its Drizzle adapter can find them.

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------

export const userRole = pgEnum("user_role", ["student", "career_service"]);

export const applicationStatus = pgEnum("application_status", [
  "sent",
  "in_process",
  "interview",
  "offer",
  "rejected",
  "no_response",
]);

export const reminderReason = pgEnum("reminder_reason", [
  "company_median",
  "fallback_14_days",
]);

export const reminderOutcome = pgEnum("reminder_outcome", [
  "followup_done",
  "dismissed",
]);

export const eventName = pgEnum("event_name", [
  "application_form_opened",
  "application_created",
  "reminder_triggered",
  "reminder_followup_done",
  "reminder_dismissed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

// ---------- Better Auth tables ----------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  // Trilho fields (declared as additionalFields in lib/auth.ts)
  role: userRole("role").notNull().default("student"),
  // NULL = the student has not answered the consent question yet (US01-4)
  consent: boolean("consent"),
  consentUpdatedAt: timestamp("consent_updated_at", { withTimezone: true }),
  // Needed for M6 (activation rate); Better Auth only stores a boolean
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ---------- Trilho tables ----------

export const company = pgTable(
  "company",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Display name: the first version typed, trimmed (R11)
    name: text("name").notNull(),
    // R11: trimmed, inner spaces collapsed, lowercase
    normalizedName: text("normalized_name").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("company_normalized_name_unique").on(t.normalizedName),
    check("company_name_length", sql`char_length(${t.name}) BETWEEN 1 AND 120`),
  ],
);

export const sector = pgTable("sector", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const channel = pgTable("channel", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const jobType = pgTable("job_type", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const application = pgTable(
  "application",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "restrict" }),
    sectorId: uuid("sector_id")
      .notNull()
      .references(() => sector.id, { onDelete: "restrict" }),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => channel.id, { onDelete: "restrict" }),
    jobTypeId: uuid("job_type_id")
      .notNull()
      .references(() => jobType.id, { onDelete: "restrict" }),
    roleTitle: text("role_title").notNull(),
    // "Not in the future" depends on today, so it is validated in Zod, not here
    dateSent: date("date_sent", { mode: "string" }).notNull(),
    // Duplicates the last status_change on purpose (fast pipeline)
    currentStatus: applicationStatus("current_status").notNull().default("sent"),
    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("application_user_id_idx").on(t.userId),
    index("application_company_id_idx").on(t.companyId),
    check("application_role_title_length", sql`char_length(${t.roleTitle}) BETWEEN 1 AND 120`),
  ],
);

export const statusChange = pgTable(
  "status_change",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => application.id, { onDelete: "cascade" }),
    status: applicationStatus("status").notNull(),
    changedOn: date("changed_on", { mode: "string" }).notNull(),
    // true only for the 60-day rule (R5)
    isAutomatic: boolean("is_automatic").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("status_change_application_changed_on_idx").on(t.applicationId, t.changedOn)],
);

export const reminder = pgTable(
  "reminder",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => application.id, { onDelete: "cascade" }),
    // One reminder per quiet period (R12): the quiet period starts at this status change
    statusChangeId: uuid("status_change_id")
      .notNull()
      .references(() => statusChange.id, { onDelete: "cascade" }),
    reason: reminderReason("reason").notNull(),
    thresholdDays: smallint("threshold_days").notNull(),
    triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull().defaultNow(),
    outcome: reminderOutcome("outcome"),
    outcomeAt: timestamp("outcome_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("reminder_status_change_id_unique").on(t.statusChangeId),
    index("reminder_application_id_idx").on(t.applicationId),
  ],
);

export const productEvent = pgTable(
  "product_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Deleting an account deletes its events (decision 027)
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: eventName("name").notNull(),
    applicationId: uuid("application_id").references(() => application.id, {
      onDelete: "set null",
    }),
    properties: jsonb("properties").$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
  },
  (t) => [
    index("product_event_name_created_at_idx").on(t.name, t.createdAt),
    index("product_event_user_id_idx").on(t.userId),
  ],
);

export type ApplicationStatus = (typeof applicationStatus.enumValues)[number];
export type UserRole = (typeof userRole.enumValues)[number];
