ALTER TABLE "board_columns" ADD COLUMN "color" text;--> statement-breakpoint
-- Backfill das colunas padrão dos projetos que já existem, pra não abrirem sem cor nenhuma
-- depois do deploy. Só toca em colunas ainda sem cor e com exatamente os nomes semeados por
-- `createProject`; qualquer coluna criada pelo usuário fica intocada (segue nula = neutra).
UPDATE "board_columns" SET "color" = '#eaaa08' WHERE "color" IS NULL AND "name" = 'A Fazer';--> statement-breakpoint
UPDATE "board_columns" SET "color" = '#7a5af8' WHERE "color" IS NULL AND "name" = 'Em Progresso';--> statement-breakpoint
UPDATE "board_columns" SET "color" = '#17b26a' WHERE "color" IS NULL AND "name" = 'Concluído';
