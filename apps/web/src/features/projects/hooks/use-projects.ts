import type { UpdateProjectDocumentInput, UpdateProjectInput, UpdateProjectPageInput } from "@gikan/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
    type Project,
    type ProjectSummary,
    createProject,
    deleteProject,
    getProjectDocument,
    listProjects,
    updateProject,
    updateProjectDocument,
    updateProjectPage,
} from "../api";
import { projectQueryKey } from "./use-project";

export const PROJECTS_QUERY_KEY = ["projects"] as const;

export function useProjects() {
    return useQuery({ queryKey: PROJECTS_QUERY_KEY, queryFn: listProjects });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
        },
    });
}

export function useUpdateProject(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateProjectInput) => updateProject(projectId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
        },
    });
}

export function useDeleteProject(project: Pick<Project, "id" | "issueKey">) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    return useMutation({
        mutationFn: () => deleteProject(project.id),
        onSuccess: async () => {
            navigate("/", { replace: true, flushSync: true });
            const filters = {
                predicate: (query: { queryKey: readonly unknown[] }) =>
                    (query.queryKey[0] === "projects" && query.queryKey[1] === project.id) ||
                    (query.queryKey[0] === "issues" && typeof query.queryKey[1] === "string" && query.queryKey[1].startsWith(`${project.issueKey}-`)),
            };
            await queryClient.cancelQueries(filters);
            queryClient.removeQueries(filters);
            queryClient.setQueryData<ProjectSummary[]>(PROJECTS_QUERY_KEY, (old) => old?.filter((item) => item.id !== project.id));
            await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY, exact: true });
        },
    });
}

export function useUpdateProjectPage(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateProjectPageInput) => updateProjectPage(projectId, input),
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: projectQueryKey(projectId) });
            const previousProject = queryClient.getQueryData<Project>(projectQueryKey(projectId));

            queryClient.setQueryData<Project>(projectQueryKey(projectId), (old) => (old ? { ...old, pageContent: input.pageContent } : old));

            return { previousProject };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousProject) {
                queryClient.setQueryData(projectQueryKey(projectId), context.previousProject);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
        },
    });
}

export function useProjectDocument(projectId: string) {
    return useQuery({ queryKey: ["projects", projectId, "document"], queryFn: () => getProjectDocument(projectId), enabled: !!projectId });
}

export function useUpdateProjectDocument(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UpdateProjectDocumentInput) => updateProjectDocument(projectId, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId, "document"] }),
    });
}
