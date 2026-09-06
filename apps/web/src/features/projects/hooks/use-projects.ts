import type { UpdateProjectInput } from "@gikan/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, listProjects, updateProject } from "../api";
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
