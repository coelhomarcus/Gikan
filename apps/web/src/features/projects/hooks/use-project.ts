import { useQuery } from "@tanstack/react-query";
import { getProject } from "../api";

export function projectQueryKey(projectId: string) {
    return ["projects", projectId] as const;
}

export function useProject(projectId: string) {
    return useQuery({
        queryKey: projectQueryKey(projectId),
        queryFn: () => getProject(projectId),
        enabled: !!projectId,
    });
}
