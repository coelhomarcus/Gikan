import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    issueKey: text("issue_key").notNull(),
    nextIssueNumber: integer("next_issue_number").notNull().default(1),
    description: text("description"),
    repositoryUrl: text("repository_url"),
    icon: text("icon"),
    pageContent: text("page_content").notNull().default(""),
    createdBy: uuid("created_by")
        .notNull()
        .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
