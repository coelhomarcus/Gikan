ALTER TABLE "board_columns" ADD COLUMN "color" text;--> statement-breakpoint
-- Backfill colors for default columns in existing projects so they do not open without a color
-- after deployment. Only columns without a color and with exactly the names seeded by
-- `createProject` are touched; user-created columns remain unchanged (null = neutral).
UPDATE "board_columns" SET "color" = '#eaaa08' WHERE "color" IS NULL AND "name" = 'A Fazer';--> statement-breakpoint
UPDATE "board_columns" SET "color" = '#7a5af8' WHERE "color" IS NULL AND "name" = 'Em Progresso';--> statement-breakpoint
UPDATE "board_columns" SET "color" = '#17b26a' WHERE "color" IS NULL AND "name" = 'Concluído';
