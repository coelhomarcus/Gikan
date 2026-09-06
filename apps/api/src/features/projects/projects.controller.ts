import { addProjectMemberSchema, createProjectSchema, updateProjectSchema } from "@todokanban/shared";
import { asyncHandler } from "../../middleware/async-handler";
import {
    addProjectMember,
    createProject,
    deleteProject,
    getProjectById,
    listProjectMembers,
    listProjectsForUser,
    removeProjectMember,
    updateProject,
} from "./projects.service";

export const create = asyncHandler(async (req, res) => {
    const input = createProjectSchema.parse(req.body);
    const project = await createProject(input, req.user!.sub);
    res.status(201).json({ project });
});

export const list = asyncHandler(async (req, res) => {
    const projectList = await listProjectsForUser(req.user!.sub, req.user!.isAdmin);
    res.json({ projects: projectList });
});

export const getOne = asyncHandler<{ projectId: string }>(async (req, res) => {
    const project = await getProjectById(req.params.projectId);
    res.json({ project });
});

export const update = asyncHandler<{ projectId: string }>(async (req, res) => {
    const input = updateProjectSchema.parse(req.body);
    const project = await updateProject(req.params.projectId, input);
    res.json({ project });
});

export const remove = asyncHandler<{ projectId: string }>(async (req, res) => {
    await deleteProject(req.params.projectId);
    res.status(204).send();
});

export const listMembers = asyncHandler<{ projectId: string }>(async (req, res) => {
    const members = await listProjectMembers(req.params.projectId);
    res.json({ members });
});

export const addMember = asyncHandler<{ projectId: string }>(async (req, res) => {
    const input = addProjectMemberSchema.parse(req.body);
    const member = await addProjectMember(req.params.projectId, input.username);
    res.status(201).json({ member });
});

export const removeMember = asyncHandler<{ projectId: string; userId: string }>(async (req, res) => {
    await removeProjectMember(req.params.projectId, req.params.userId);
    res.status(204).send();
});
