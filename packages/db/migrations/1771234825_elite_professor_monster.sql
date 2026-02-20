CREATE TABLE "transaction_event" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"transaction_id" text NOT NULL,
	"type" text NOT NULL,
	"new_status" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE INDEX "transaction_event_transaction_id_idx" ON "transaction_event" ("transaction_id");--> statement-breakpoint
ALTER TABLE "transaction_event" ADD CONSTRAINT "transaction_event_transaction_id_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id") ON DELETE CASCADE;