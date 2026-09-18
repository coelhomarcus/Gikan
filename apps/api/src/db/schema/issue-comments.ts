import { jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { issues, type TiptapDocument } from "./issues";
import { users } from "./users";

export const issueComments = pgTable("issue_comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id")
        .notNull()
        .references(() => issues.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
        .notNull()
        .references(() => users.id),
    contentJson: jsonb("content_json").$type<TiptapDocument>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
