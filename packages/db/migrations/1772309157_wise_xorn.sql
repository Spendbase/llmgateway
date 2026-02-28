ALTER TABLE "banner" ALTER COLUMN "enabled" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "banner" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "banner" DROP COLUMN "priority";