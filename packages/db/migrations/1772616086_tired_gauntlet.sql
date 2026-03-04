
ALTER TABLE "api_key" ADD COLUMN "reset_period" text DEFAULT 'none' NOT NULL CHECK ("reset_period" IN ('daily', 'weekly', 'monthly', 'none'));--> statement-breakpoint
ALTER TABLE "api_key" ADD COLUMN "last_reset_at" timestamp;--> statement-breakpoint
ALTER TABLE "api_key" ADD COLUMN "next_reset_at" timestamp;--> statement-breakpoint
ALTER TABLE "api_key" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint


CREATE INDEX "api_key_next_reset_at_idx" ON "api_key" ("next_reset_at");--> statement-breakpoint
CREATE INDEX "api_key_expires_at_idx" ON "api_key" ("expires_at");--> statement-breakpoint
