import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addProjectMember, listProjectMembers, removeProjectMember } from "../api";

function membersQueryKey(projectId: string) {
    return ["projects", projectId, "members"] as const;
}

export function useProjectMembers(projectId: string) {
    return useQuery({
        queryKey: membersQueryKey(projectId),
        queryFn: () => listProjectMembers(projectId),
        enabled: !!projectId,
    });
}

export function useAddProjectMember(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (username: string) => addProjectMember(projectId, username),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: membersQueryKey(projectId) });
        },
    });
}

export function useRemoveProjectMember(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => removeProjectMember(projectId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: membersQueryKey(projectId) });
        },
    });
}
