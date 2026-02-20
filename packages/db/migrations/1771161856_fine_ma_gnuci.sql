ALTER TABLE "model_provider_mapping" ADD COLUMN "deactivation_reason" text;--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "plan" SET DEFAULT 'pro';