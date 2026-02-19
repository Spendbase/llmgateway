ALTER TABLE "organization" ADD COLUMN "organization_context" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "plan" SET DEFAULT 'pro';