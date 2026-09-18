import { index, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { issues } from "./issues";

export const issueRelationTypeEnum = pgEnum("issue_relation_type", ["blocks", "blocked_by", "related", "duplicate"]);

export const issueRelations = pgTable(
    "issue_relations",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        sourceIssueId: uuid("source_issue_id")
            .notNull()
            .references(() => issues.id, { onDelete: "cascade" }),
        targetIssueId: uuid("target_issue_id")
            .notNull()
            .references(() => issues.id, { onDelete: "cascade" }),
        type: issueRelationTypeEnum("type").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index("issue_relations_source_issue_id_idx").on(table.sourceIssueId), index("issue_relations_target_issue_id_idx").on(table.targetIssueId)],
);
