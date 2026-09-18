import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireProjectMember } from "../../middleware/project-membership.middleware";
import { addComment, addRelation, activity, comments, create, getOne, list, patchComment, relations, remove, removeComment, removeRelation, update } from "./issues.controller";

export const projectIssuesRouter = Router({ mergeParams: true });
projectIssuesRouter.use(requireProjectMember);
projectIssuesRouter.get("/", list);
projectIssuesRouter.post("/", create);

export const issuesRouter = Router();
issuesRouter.use(requireAuth);
issuesRouter.get("/:issueIdentifier", getOne);
issuesRouter.patch("/:issueIdentifier", update);
issuesRouter.delete("/:issueIdentifier", remove);
issuesRouter.get("/:issueIdentifier/comments", comments);
issuesRouter.post("/:issueIdentifier/comments", addComment);
issuesRouter.get("/:issueIdentifier/activity", activity);
issuesRouter.get("/:issueIdentifier/relations", relations);
issuesRouter.post("/:issueIdentifier/relations", addRelation);

export const issueCommentsRouter = Router();
issueCommentsRouter.use(requireAuth);
issueCommentsRouter.patch("/:commentId", patchComment);
issueCommentsRouter.delete("/:commentId", removeComment);

export const issueRelationsRouter = Router();
issueRelationsRouter.use(requireAuth);
issueRelationsRouter.delete("/:relationId", removeRelation);
