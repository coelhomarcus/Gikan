ALTER TABLE "project_documents" DROP CONSTRAINT "project_documents_project_id_unique";
--> statement-breakpoint
ALTER TABLE "project_documents" ADD COLUMN "title" text DEFAULT 'Untitled' NOT NULL;
ALTER TABLE "project_documents" ADD COLUMN "created_by" uuid;
ALTER TABLE "project_documents" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "project_documents" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
UPDATE "project_documents" AS d SET "title" = 'Overview notes', "created_by" = p."created_by", "created_at" = d."updated_at"
FROM "projects" AS p WHERE d."project_id" = p."id";
--> statement-breakpoint
ALTER TABLE "project_documents" ALTER COLUMN "created_by" SET NOT NULL;
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id");
CREATE INDEX "project_documents_project_created_idx" ON "project_documents" ("project_id", "created_at", "id");
