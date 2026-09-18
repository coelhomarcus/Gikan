ALTER TYPE "card_importance" RENAME TO "issue_priority";--> statement-breakpoint
ALTER TABLE "cards" RENAME TO "issues";--> statement-breakpoint
ALTER INDEX "cards_project_id_idx" RENAME TO "issues_project_id_idx";--> statement-breakpoint
ALTER INDEX "cards_column_id_idx" RENAME TO "issues_column_id_idx";--> statement-breakpoint
ALTER INDEX "cards_assignee_id_idx" RENAME TO "issues_assignee_id_idx";--> statement-breakpoint
ALTER INDEX "cards_category_id_idx" RENAME TO "issues_category_id_idx";--> statement-breakpoint
ALTER TABLE "issues" RENAME CONSTRAINT "cards_project_id_projects_id_fk" TO "issues_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "issues" RENAME CONSTRAINT "cards_column_id_board_columns_id_fk" TO "issues_column_id_board_columns_id_fk";--> statement-breakpoint
ALTER TABLE "issues" RENAME CONSTRAINT "cards_assignee_id_users_id_fk" TO "issues_assignee_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "issues" RENAME CONSTRAINT "cards_category_id_categories_id_fk" TO "issues_category_id_categories_id_fk";--> statement-breakpoint
ALTER TABLE "issues" RENAME CONSTRAINT "cards_created_by_users_id_fk" TO "issues_created_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "issues" RENAME COLUMN "importance" TO "priority";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "issue_key" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "next_issue_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
DO $$
DECLARE
    project_record record;
    candidate text;
    base_key text;
    suffix integer;
BEGIN
    FOR project_record IN SELECT id, name FROM "projects" WHERE "issue_key" IS NULL LOOP
        base_key := regexp_replace(upper(project_record.name), '[^A-Z0-9]', '', 'g');
        IF length(base_key) < 2 THEN
            base_key := 'PRJ';
        END IF;
        base_key := left(base_key, 8);
        candidate := base_key;
        suffix := 1;
        WHILE EXISTS (SELECT 1 FROM "projects" WHERE "issue_key" = candidate) LOOP
            candidate := left(base_key, 8 - length(suffix::text)) || suffix::text;
            suffix := suffix + 1;
        END LOOP;
        UPDATE "projects" SET "issue_key" = candidate WHERE id = project_record.id;
    END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "issue_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_issue_key_unique" UNIQUE("issue_key");--> statement-breakpoint
CREATE TYPE "public"."cycle_status" AS ENUM('planned', 'active', 'completed');--> statement-breakpoint
CREATE TABLE "project_cycles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "number" integer NOT NULL,
    "name" text NOT NULL,
    "status" "cycle_status" DEFAULT 'planned' NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "project_cycles" ADD CONSTRAINT "project_cycles_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_cycles_project_id_idx" ON "project_cycles" USING btree ("project_id");--> statement-breakpoint
CREATE TYPE "public"."issue_relation_type" AS ENUM('blocks', 'blocked_by', 'related', 'duplicate');--> statement-breakpoint
CREATE TYPE "public"."issue_activity_type" AS ENUM('created', 'status_changed', 'priority_changed', 'assignee_changed', 'category_changed', 'cycle_changed', 'estimate_changed', 'parent_changed', 'relation_added', 'relation_removed');--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "number" integer;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "description_json" jsonb;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "parent_issue_id" uuid;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "cycle_id" uuid;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "estimate" integer;--> statement-breakpoint
WITH numbered AS (
    SELECT id, row_number() OVER (PARTITION BY project_id ORDER BY created_at, id) AS issue_number
    FROM "issues"
)
UPDATE "issues" SET "number" = numbered.issue_number FROM numbered WHERE "issues".id = numbered.id;--> statement-breakpoint
UPDATE "projects" SET "next_issue_number" = COALESCE((SELECT max("number") + 1 FROM "issues" WHERE "issues".project_id = "projects".id), 1);--> statement-breakpoint
UPDATE "issues" SET "description_json" = jsonb_build_object(
    'type', 'doc',
    'content', CASE
        WHEN "description" IS NULL OR "description" = '' THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', "description"))))
    END
);--> statement-breakpoint
ALTER TABLE "issues" ALTER COLUMN "number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "issues" ALTER COLUMN "description_json" SET DEFAULT '{"type":"doc","content":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "issues" ALTER COLUMN "description_json" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_number_unique" UNIQUE("project_id", "number");--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_parent_issue_id_fk" FOREIGN KEY ("parent_issue_id") REFERENCES "public"."issues"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'issues_cycle_id_project_cycles_id_fk'
          AND conrelid = 'public.issues'::regclass
    ) THEN
        ALTER TABLE "issues" ADD CONSTRAINT "issues_cycle_id_project_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."project_cycles"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
CREATE INDEX "issues_parent_issue_id_idx" ON "issues" USING btree ("parent_issue_id");--> statement-breakpoint
CREATE INDEX "issues_cycle_id_idx" ON "issues" USING btree ("cycle_id");--> statement-breakpoint
CREATE TABLE "issue_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "issue_id" uuid NOT NULL,
    "author_id" uuid NOT NULL,
    "content_json" jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "issue_activities" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "issue_id" uuid NOT NULL,
    "actor_id" uuid NOT NULL,
    "type" "issue_activity_type" NOT NULL,
    "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "issue_activities" ADD CONSTRAINT "issue_activities_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_activities" ADD CONSTRAINT "issue_activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "issue_relations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "source_issue_id" uuid NOT NULL,
    "target_issue_id" uuid NOT NULL,
    "type" "issue_relation_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "issue_relations" ADD CONSTRAINT "issue_relations_source_issue_id_issues_id_fk" FOREIGN KEY ("source_issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_relations" ADD CONSTRAINT "issue_relations_target_issue_id_issues_id_fk" FOREIGN KEY ("target_issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issue_relations_source_issue_id_idx" ON "issue_relations" USING btree ("source_issue_id");--> statement-breakpoint
CREATE INDEX "issue_relations_target_issue_id_idx" ON "issue_relations" USING btree ("target_issue_id");--> statement-breakpoint
CREATE TABLE "project_documents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "content_json" jsonb NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_unique" UNIQUE("project_id");--> statement-breakpoint
INSERT INTO "project_documents" ("project_id", "content_json")
SELECT "id", CASE
    WHEN "page_content" = '' THEN '{"type":"doc","content":[]}'::jsonb
    ELSE jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', "page_content")))))
END
FROM "projects";--> statement-breakpoint
