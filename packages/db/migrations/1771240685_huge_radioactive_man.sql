ALTER TABLE "model_provider_mapping" ADD COLUMN "web_search_price" numeric;--> statement-breakpoint
ALTER TABLE "model_provider_mapping" ADD COLUMN "reasoning_levels" json;--> statement-breakpoint
ALTER TABLE "model_provider_mapping" ADD COLUMN "pricing_tiers" json;