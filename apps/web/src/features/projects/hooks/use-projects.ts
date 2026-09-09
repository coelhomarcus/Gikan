import type { UpdateProjectInput, UpdateProjectPageInput } from "@gikan/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Project, createProject, listProjects, updateProject, updateProjectPage } from "../api";
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
