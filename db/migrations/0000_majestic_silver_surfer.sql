CREATE TYPE "public"."application_status" AS ENUM('sent', 'in_process', 'interview', 'offer', 'rejected', 'no_response');--> statement-breakpoint
CREATE TYPE "public"."event_name" AS ENUM('application_form_opened', 'application_created', 'reminder_triggered', 'reminder_followup_done', 'reminder_dismissed');--> statement-breakpoint
CREATE TYPE "public"."reminder_outcome" AS ENUM('followup_done', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."reminder_reason" AS ENUM('company_median', 'fallback_14_days');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'career_service');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"sector_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"job_type_id" uuid NOT NULL,
	"role_title" text NOT NULL,
	"date_sent" date NOT NULL,
	"current_status" "application_status" DEFAULT 'sent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_role_title_length" CHECK (char_length("application"."role_title") BETWEEN 1 AND 120)
);
--> statement-breakpoint
CREATE TABLE "channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "channel_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_name_length" CHECK (char_length("company"."name") BETWEEN 1 AND 120)
);
--> statement-breakpoint
CREATE TABLE "job_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "job_type_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" "event_name" NOT NULL,
	"application_id" uuid,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"status_change_id" uuid NOT NULL,
	"reason" "reminder_reason" NOT NULL,
	"threshold_days" smallint NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"outcome" "reminder_outcome",
	"outcome_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sector" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "sector_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "status_change" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"status" "application_status" NOT NULL,
	"changed_on" date NOT NULL,
	"is_automatic" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"consent" boolean,
	"consent_updated_at" timestamp with time zone,
	"email_verified_at" timestamp with time zone,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_sector_id_sector_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sector"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_job_type_id_job_type_id_fk" FOREIGN KEY ("job_type_id") REFERENCES "public"."job_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_event" ADD CONSTRAINT "product_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_event" ADD CONSTRAINT "product_event_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_status_change_id_status_change_id_fk" FOREIGN KEY ("status_change_id") REFERENCES "public"."status_change"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_change" ADD CONSTRAINT "status_change_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "application_user_id_idx" ON "application" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "application_company_id_idx" ON "application" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "company_normalized_name_unique" ON "company" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "product_event_name_created_at_idx" ON "product_event" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "product_event_user_id_idx" ON "product_event" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reminder_status_change_id_unique" ON "reminder" USING btree ("status_change_id");--> statement-breakpoint
CREATE INDEX "reminder_application_id_idx" ON "reminder" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "status_change_application_changed_on_idx" ON "status_change" USING btree ("application_id","changed_on");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");