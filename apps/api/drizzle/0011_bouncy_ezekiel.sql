ALTER TABLE "project_documents" ADD COLUMN "icon_appearance" jsonb;--> statement-breakpoint
ALTER TABLE "project_documents" ADD COLUMN "cover" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "icon_appearance" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cover" jsonb;
--> statement-breakpoint
UPDATE "projects"
SET "icon_appearance" = jsonb_build_object('type', 'icon', 'key', "icon")
WHERE "icon" IS NOT NULL;
