CREATE TABLE "organization_alert_recipient" (
	"id" text PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "organization_alert_recipient_organization_id_email_unique" UNIQUE("organization_id","email")
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "low_balance_alert_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "low_balance_alert_threshold" numeric;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "low_balance_alert_last_state_below" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "organization_alert_recipient_organization_id_idx" ON "organization_alert_recipient" ("organization_id");--> statement-breakpoint
ALTER TABLE "organization_alert_recipient" ADD CONSTRAINT "organization_alert_recipient_o5eiUE49399S_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;