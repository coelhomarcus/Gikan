import { boardColumns, categories, issueActivities, issueComments, issueRelations, issues, projectMembers, projectDocuments, projectCycles, projects, users } from "../../db/schema";
import { db } from "../../db";

export interface DatabaseBackup {
    version: 2;
    exportedAt: string;
    tables: {
        users: (typeof users.$inferSelect)[];
        projects: (typeof projects.$inferSelect)[];
        projectMembers: (typeof projectMembers.$inferSelect)[];
        boardColumns: (typeof boardColumns.$inferSelect)[];
        categories: (typeof categories.$inferSelect)[];
        issues: (typeof issues.$inferSelect)[];
        cycles: (typeof projectCycles.$inferSelect)[];
        comments: (typeof issueComments.$inferSelect)[];
        activities: (typeof issueActivities.$inferSelect)[];
        relations: (typeof issueRelations.$inferSelect)[];
        documents: (typeof projectDocuments.$inferSelect)[];
    };
}

export async function createBackup(): Promise<DatabaseBackup> {
    const [usersRows, projectsRows, projectMembersRows, boardColumnsRows, categoriesRows, issuesRows, cyclesRows, commentsRows, activitiesRows, relationsRows, documentsRows] = await Promise.all([
        db.select().from(users),
        db.select().from(projects),
        db.select().from(projectMembers),
        db.select().from(boardColumns),
        db.select().from(categories),
        db.select().from(issues),
        db.select().from(projectCycles),
        db.select().from(issueComments),
        db.select().from(issueActivities),
        db.select().from(issueRelations),
        db.select().from(projectDocuments),
    ]);

    return {
        version: 2,
        exportedAt: new Date().toISOString(),
        tables: {
            users: usersRows,
            projects: projectsRows,
            projectMembers: projectMembersRows,
            boardColumns: boardColumnsRows,
            categories: categoriesRows,
            issues: issuesRows,
            cycles: cyclesRows,
            comments: commentsRows,
            activities: activitiesRows,
            relations: relationsRows,
            documents: documentsRows,
        },
    };
}
