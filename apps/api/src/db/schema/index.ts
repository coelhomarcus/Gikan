import { relations } from "drizzle-orm";
import { boardColumns } from "./board-columns";
import { categories } from "./categories";
import { projectCycles } from "./cycles";
import { issueActivities } from "./issue-activities";
import { issueComments } from "./issue-comments";
import { issueRelations } from "./issue-relations";
import { issues } from "./issues";
import { projectDocuments } from "./project-documents";
import { projectMembers } from "./project-members";
import { projects } from "./projects";
import { users } from "./users";

export * from "./board-columns";
export * from "./categories";
export * from "./cycles";
export * from "./issue-activities";
export * from "./issue-comments";
export * from "./issue-relations";
export * from "./issues";
export * from "./project-documents";
export * from "./project-members";
export * from "./projects";
export * from "./users";

export const usersRelations = relations(users, ({ many }) => ({
    projectsCreated: many(projects),
    projectMemberships: many(projectMembers),
    categoriesCreated: many(categories),
    issuesCreated: many(issues, { relationName: "issueCreatedBy" }),
    issuesAssigned: many(issues, { relationName: "issueAssignee" }),
    comments: many(issueComments),
    activities: many(issueActivities),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    creator: one(users, { fields: [projects.createdBy], references: [users.id] }),
    members: many(projectMembers),
    categories: many(categories),
    columns: many(boardColumns),
    issues: many(issues),
    cycles: many(projectCycles),
    documents: many(projectDocuments),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
    project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
    user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    project: one(projects, { fields: [categories.projectId], references: [projects.id] }),
    createdBy: one(users, { fields: [categories.createdBy], references: [users.id] }),
    issues: many(issues),
}));

export const boardColumnsRelations = relations(boardColumns, ({ one, many }) => ({
    project: one(projects, { fields: [boardColumns.projectId], references: [projects.id] }),
    issues: many(issues),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
    project: one(projects, { fields: [issues.projectId], references: [projects.id] }),
    column: one(boardColumns, { fields: [issues.columnId], references: [boardColumns.id] }),
    assignee: one(users, {
        fields: [issues.assigneeId],
        references: [users.id],
        relationName: "issueAssignee",
    }),
    createdBy: one(users, {
        fields: [issues.createdBy],
        references: [users.id],
        relationName: "issueCreatedBy",
    }),
    category: one(categories, { fields: [issues.categoryId], references: [categories.id] }),
    cycle: one(projectCycles, { fields: [issues.cycleId], references: [projectCycles.id] }),
    parent: one(issues, { fields: [issues.parentIssueId], references: [issues.id], relationName: "issueParent" }),
    children: many(issues, { relationName: "issueParent" }),
    comments: many(issueComments),
    activities: many(issueActivities),
    outgoingRelations: many(issueRelations, { relationName: "relationSource" }),
    incomingRelations: many(issueRelations, { relationName: "relationTarget" }),
}));

export const projectCyclesRelations = relations(projectCycles, ({ one, many }) => ({
    project: one(projects, { fields: [projectCycles.projectId], references: [projects.id] }),
    issues: many(issues),
}));

export const issueCommentsRelations = relations(issueComments, ({ one }) => ({
    issue: one(issues, { fields: [issueComments.issueId], references: [issues.id] }),
    author: one(users, { fields: [issueComments.authorId], references: [users.id] }),
}));

export const issueActivitiesRelations = relations(issueActivities, ({ one }) => ({
    issue: one(issues, { fields: [issueActivities.issueId], references: [issues.id] }),
    actor: one(users, { fields: [issueActivities.actorId], references: [users.id] }),
}));

export const issueRelationsRelations = relations(issueRelations, ({ one }) => ({
    source: one(issues, { fields: [issueRelations.sourceIssueId], references: [issues.id], relationName: "relationSource" }),
    target: one(issues, { fields: [issueRelations.targetIssueId], references: [issues.id], relationName: "relationTarget" }),
}));

export const projectDocumentsRelations = relations(projectDocuments, ({ one }) => ({
    project: one(projects, { fields: [projectDocuments.projectId], references: [projects.id] }),
}));
