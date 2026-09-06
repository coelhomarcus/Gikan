import type { projectMembers } from "../db/schema";
import type { JwtPayload } from "../lib/jwt";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
            projectMembership?: typeof projectMembers.$inferSelect;
        }
    }
}

export {};
