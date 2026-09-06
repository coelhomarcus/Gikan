import { boardColumns, cards, categories, projectMembers, projects, users } from "../../db/schema";
import { db } from "../../db";

export interface DatabaseBackup {
    version: 1;
    exportedAt: string;
    tables: {
        users: (typeof users.$inferSelect)[];
        projects: (typeof projects.$inferSelect)[];
        projectMembers: (typeof projectMembers.$inferSelect)[];
        boardColumns: (typeof boardColumns.$inferSelect)[];
        categories: (typeof categories.$inferSelect)[];
        cards: (typeof cards.$inferSelect)[];
    };
}

export async function createBackup(): Promise<DatabaseBackup> {
    const [usersRows, projectsRows, projectMembersRows, boardColumnsRows, categoriesRows, cardsRows] = await Promise.all([
        db.select().from(users),
        db.select().from(projects),
        db.select().from(projectMembers),
        db.select().from(boardColumns),
        db.select().from(categories),
        db.select().from(cards),
    ]);

    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        tables: {
            users: usersRows,
            projects: projectsRows,
            projectMembers: projectMembersRows,
            boardColumns: boardColumnsRows,
            categories: categoriesRows,
            cards: cardsRows,
        },
    };
}
