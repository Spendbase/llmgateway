CREATE TABLE "tts_generation" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"model" text NOT NULL,
	"voice" text NOT NULL,
	"format" text NOT NULL,
	"text" text NOT NULL,
	"chars" integer,
	"cost" numeric,
	"file" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "log" ADD COLUMN "tts_chars" integer;--> statement-breakpoint
ALTER TABLE "log" ADD COLUMN "tts_voice" text;--> statement-breakpoint
ALTER TABLE "log" ADD COLUMN "tts_format" text;--> statement-breakpoint
ALTER TABLE "model_history" ADD COLUMN "total_tts_chars" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "model_provider_mapping" ADD COLUMN "audio_config" jsonb;--> statement-breakpoint
ALTER TABLE "model_provider_mapping_history" ADD COLUMN "total_tts_chars" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "tts_generation_user_id_idx" ON "tts_generation" ("user_id");--> statement-breakpoint
ALTER TABLE "tts_generation" ADD CONSTRAINT "tts_generation_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;