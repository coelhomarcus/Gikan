import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, listProjects } from "../api";

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
