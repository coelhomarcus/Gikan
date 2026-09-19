import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";
import type { TiptapDocument } from "./issues";

export const projectDocuments = pgTable(
  "project_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revision: integer("revision").notNull().default(1),
    contentJson: jsonb("content_json").$type<TiptapDocument>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectCreated: index("project_documents_project_created_idx").on(
      table.projectId,
      table.createdAt,
      table.id,
    ),
  }),
);
