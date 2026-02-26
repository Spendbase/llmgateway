CREATE TABLE "organization_voucher" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"organization_id" text NOT NULL,
	"voucher_id" text NOT NULL,
	"org_usage_limit" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "organization_voucher_organization_id_voucher_id_unique" UNIQUE("organization_id","voucher_id")
);
--> statement-breakpoint
CREATE TABLE "voucher" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"code" text NOT NULL UNIQUE,
	"deposit_amount" numeric DEFAULT '0' NOT NULL,
	"global_usage_limit" integer DEFAULT 1 NOT NULL,
	"per_account_usage_limit" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voucher_redemption" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"voucher_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "organization_voucher_voucher_id_idx" ON "organization_voucher" ("voucher_id");--> statement-breakpoint
CREATE INDEX "organization_voucher_organization_id_idx" ON "organization_voucher" ("organization_id");--> statement-breakpoint
CREATE INDEX "voucher_redemption_voucher_id_idx" ON "voucher_redemption" ("voucher_id");--> statement-breakpoint
CREATE INDEX "voucher_redemption_voucher_id_organization_id_idx" ON "voucher_redemption" ("voucher_id","organization_id");--> statement-breakpoint
CREATE INDEX "voucher_redemption_voucher_id_organization_id_user_id_idx" ON "voucher_redemption" ("voucher_id","organization_id","user_id");--> statement-breakpoint
ALTER TABLE "organization_voucher" ADD CONSTRAINT "organization_voucher_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_voucher" ADD CONSTRAINT "organization_voucher_voucher_id_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "voucher_redemption" ADD CONSTRAINT "voucher_redemption_voucher_id_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "voucher_redemption" ADD CONSTRAINT "voucher_redemption_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "voucher_redemption" ADD CONSTRAINT "voucher_redemption_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "voucher_redemption" ADD CONSTRAINT "voucher_redemption_transaction_id_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id") ON DELETE CASCADE;