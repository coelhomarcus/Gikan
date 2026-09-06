ALTER TYPE "public"."card_difficulty" RENAME TO "card_importance";--> statement-breakpoint
ALTER TABLE "cards" RENAME COLUMN "difficulty" TO "importance";
