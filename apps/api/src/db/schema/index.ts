import { relations } from "drizzle-orm";
import { boardColumns } from "./board-columns";
import { cards } from "./cards";
import { categories } from "./categories";
import { projectMembers } from "./project-members";
import { projects } from "./projects";
import { users } from "./users";

export * from "./board-columns";
export * from "./cards";
export * from "./categories";
export * from "./project-members";
export * from "./projects";
export * from "./users";

export const usersRelations = relations(users, ({ many }) => ({
    projectsCreated: many(projects),
    projectMemberships: many(projectMembers),
    categoriesCreated: many(categories),
    cardsCreated: many(cards, { relationName: "cardCreatedBy" }),
    cardsAssigned: many(cards, { relationName: "cardAssignee" }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    creator: one(users, { fields: [projects.createdBy], references: [users.id] }),
    members: many(projectMembers),
    categories: many(categories),
    columns: many(boardColumns),
    cards: many(cards),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
    project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
    user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    project: one(projects, { fields: [categories.projectId], references: [projects.id] }),
    createdBy: one(users, { fields: [categories.createdBy], references: [users.id] }),
    cards: many(cards),
}));

export const boardColumnsRelations = relations(boardColumns, ({ one, many }) => ({
    project: one(projects, { fields: [boardColumns.projectId], references: [projects.id] }),
    cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
    project: one(projects, { fields: [cards.projectId], references: [projects.id] }),
    column: one(boardColumns, { fields: [cards.columnId], references: [boardColumns.id] }),
    assignee: one(users, {
        fields: [cards.assigneeId],
        references: [users.id],
        relationName: "cardAssignee",
    }),
    createdBy: one(users, {
        fields: [cards.createdBy],
        references: [users.id],
        relationName: "cardCreatedBy",
    }),
    category: one(categories, { fields: [cards.categoryId], references: [categories.id] }),
}));
