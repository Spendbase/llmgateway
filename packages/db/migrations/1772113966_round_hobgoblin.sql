CREATE TABLE "voucher_log" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"voucher_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"transaction_id" text,
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "organization_voucher";--> statement-breakpoint
DROP TABLE "voucher_redemption";--> statement-breakpoint
ALTER TABLE "voucher" ADD COLUMN "org_usage_limit" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "voucher_log_voucher_id_idx" ON "voucher_log" ("voucher_id");--> statement-breakpoint
CREATE INDEX "voucher_log_voucher_id_organization_id_idx" ON "voucher_log" ("voucher_id","organization_id");--> statement-breakpoint
ALTER TABLE "voucher_log" ADD CONSTRAINT "voucher_log_voucher_id_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "voucher_log" ADD CONSTRAINT "voucher_log_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "voucher_log" ADD CONSTRAINT "voucher_log_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "voucher_log" ADD CONSTRAINT "voucher_log_transaction_id_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id");--> statement-breakpoint
ALTER TABLE "voucher" DROP COLUMN "per_account_usage_limit";