import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { EntityCover, EntityIcon } from "@gikan/shared";
import { users } from "./users";

export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    issueKey: text("issue_key").notNull(),
    nextIssueNumber: integer("next_issue_number").notNull().default(1),
    description: text("description"),
    repositoryUrl: text("repository_url"),
    icon: text("icon"),
    iconAppearance: jsonb("icon_appearance").$type<EntityIcon | null>(),
    cover: jsonb("cover").$type<EntityCover | null>(),
    pageContent: text("page_content").notNull().default(""),
    createdBy: uuid("created_by")
        .notNull()
        .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
