import { createIssueCommentSchema, createIssueRelationSchema, createIssueSchema, issueListQuerySchema, updateIssueCommentSchema, updateIssueSchema } from "@gikan/shared";
import { asyncHandler } from "../../middleware/async-handler";
import { assertProjectMembership } from "../../middleware/project-membership.middleware";
import {
    createIssue,
    createIssueComment,
    createIssueRelation,
    deleteIssue,
    deleteIssueComment,
    deleteIssueRelation,
    getIssueOrThrow,
    listIssueActivity,
    listIssueComments,
    listIssueRelations,
    listIssues,
    updateIssue,
    updateIssueComment,
    issueIdentifier,
} from "./issues.service";

export const list = asyncHandler<{ projectId: string }>(async (req, res) => {
    const query = issueListQuerySchema.parse(req.query);
    res.json({ issues: await listIssues(req.params.projectId, query) });
});

export const create = asyncHandler<{ projectId: string }>(async (req, res) => {
    const issue = await createIssue(req.params.projectId, createIssueSchema.parse(req.body), req.user!.sub);
    res.status(201).json({ issue });
});

export const getOne = asyncHandler<{ issueIdentifier: string }>(async (req, res) => {
    const issue = await getIssueOrThrow(req.params.issueIdentifier);
    await assertProjectMembership(issue.projectId, req.user!.sub, req.user!.isAdmin);
    res.json({ issue: { ...issue, identifier: issueIdentifier(issue) } });
});

export const update = asyncHandler<{ issueIdentifier: string }>(async (req, res) => {
    const issue = await updateIssue(req.params.issueIdentifier, updateIssueSchema.parse(req.body), req.user!.sub);
    res.json({ issue });
});

export const remove = asyncHandler<{ issueIdentifier: string }>(async (req, res) => {
    await deleteIssue(req.params.issueIdentifier, req.user!.sub);
    res.status(204).send();
});

export const comments = asyncHandler<{ issueIdentifier: string }>(async (req, res) => {
    res.json({ comments: await listIssueComments(req.params.issueIdentifier, req.user!.sub) });
});

export const addComment = asyncHandler<{ issueIdentifier: string }>(async (req, res) => {
    res.status(201).json({ comment: await createIssueComment(req.params.issueIdentifier, createIssueCommentSchema.parse(req.body), req.user!.sub) });
});

export const activity = asyncHandler<{ issueIdentifier: string }>(async (req, res) => {
    res.json({ activity: await listIssueActivity(req.params.issueIdentifier, req.user!.sub) });
});

export const relations = asyncHandler<{ issueIdentifier: string }>(async (req, res) => {
    res.json({ relations: await listIssueRelations(req.params.issueIdentifier, req.user!.sub) });
});

export const addRelation = asyncHandler<{ issueIdentifier: string }>(async (req, res) => {
    res.status(201).json({ relation: await createIssueRelation(req.params.issueIdentifier, createIssueRelationSchema.parse(req.body), req.user!.sub) });
});

export const patchComment = asyncHandler<{ commentId: string }>(async (req, res) => {
    res.json({ comment: await updateIssueComment(req.params.commentId, updateIssueCommentSchema.parse(req.body), req.user!.sub) });
});

export const removeComment = asyncHandler<{ commentId: string }>(async (req, res) => {
    await deleteIssueComment(req.params.commentId, req.user!.sub);
    res.status(204).send();
});

export const removeRelation = asyncHandler<{ relationId: string }>(async (req, res) => {
    await deleteIssueRelation(req.params.relationId, req.user!.sub);
    res.status(204).send();
});
