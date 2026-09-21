import type { CreateProjectInput, EntityCover, EntityIcon, UpdateProjectInput, UpdateProjectPageInput } from "@gikan/shared";
import { apiClient } from "@/lib/api-client";

export interface Project {
    id: string;
    name: string;
    issueKey: string;
    nextIssueNumber: number;
    description: string | null;
    repositoryUrl: string | null;
    icon: string | null;
    iconAppearance: EntityIcon | null;
    cover: EntityCover | null;
    pageContent: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export type ProjectSummary = Omit<Project, "pageContent">;
export interface ProjectMemberPreview { id: string; name: string; avatarUrl: string | null }
export type ProjectCardSummary = ProjectSummary & { memberCount: number; memberPreview: ProjectMemberPreview[] };

export interface ProjectMember {
    id: string;
    name: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    role: "owner" | "member";
    joinedAt: string;
}

export function listProjects(): Promise<ProjectCardSummary[]> {
    return apiClient.get<{ projects: ProjectCardSummary[] }>("/projects").then((res) => res.projects);
}

export function getProject(projectId: string): Promise<Project> {
    return apiClient.get<{ project: Project }>(`/projects/${projectId}`).then((res) => res.project);
}

export function createProject(input: CreateProjectInput): Promise<Project> {
    return apiClient.post<{ project: Project }>("/projects", input).then((res) => res.project);
}

export function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
    return apiClient.patch<{ project: Project }>(`/projects/${projectId}`, input).then((res) => res.project);
}

export function updateProjectPage(projectId: string, input: UpdateProjectPageInput): Promise<Project> {
    return apiClient.patch<{ project: Project }>(`/projects/${projectId}/page`, input).then((res) => res.project);
}

export function deleteProject(projectId: string): Promise<void> {
    return apiClient.delete<void>(`/projects/${projectId}`);
}

export function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return apiClient.get<{ members: ProjectMember[] }>(`/projects/${projectId}/members`).then((res) => res.members);
}

export function addProjectMember(projectId: string, username: string): Promise<ProjectMember> {
    return apiClient.post<{ member: ProjectMember }>(`/projects/${projectId}/members`, { username }).then((res) => res.member);
}

export function removeProjectMember(projectId: string, userId: string): Promise<void> {
    return apiClient.delete<void>(`/projects/${projectId}/members/${userId}`);
}
