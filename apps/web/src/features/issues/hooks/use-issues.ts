import type {
    CreateIssueCommentInput,
    CreateIssueInput,
    CreateIssueRelationInput,
    IssueListQuery,
    UpdateIssueCommentInput,
    UpdateIssueInput,
} from "@gikan/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Issue } from "../api";
import {
    createIssue,
    createIssueComment,
    createIssueRelation,
    deleteIssue,
    deleteIssueComment,
    deleteIssueRelation,
    getIssue,
    listIssueActivity,
    listIssueComments,
    listIssueRelations,
    listIssues,
    updateIssue,
    updateIssueComment,
} from "../api";
import { createCycle, deleteCycle, listCycles, updateCycle } from "../api";
import type { CreateCycleInput, UpdateCycleInput } from "@gikan/shared";

export const issuesKey = (projectId: string, query: IssueListQuery = { orderBy: "position" }) => ["projects", projectId, "issues", query] as const;
export const issueKey = (identifier: string) => ["issues", identifier] as const;

export function useIssues(projectId: string, query: IssueListQuery = { orderBy: "position" }) {
    return useQuery({ queryKey: issuesKey(projectId, query), queryFn: () => listIssues(projectId, query), enabled: !!projectId });
}

export function useIssue(identifier: string | null) {
    return useQuery({ queryKey: issueKey(identifier ?? ""), queryFn: () => getIssue(identifier!), enabled: !!identifier });
}

export function useCreateIssue(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateIssueInput) => createIssue(projectId, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId, "issues"] }),
    });
}

export function useUpdateIssue(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ identifier, input }: { identifier: string; input: UpdateIssueInput }) => updateIssue(identifier, input),
        onMutate: async ({ identifier, input }) => {
            await queryClient.cancelQueries({ queryKey: ["projects", projectId, "issues"] });
            const previous = queryClient.getQueriesData<Issue[]>({ queryKey: ["projects", projectId, "issues"] });

            for (const [queryKey] of previous) {
                queryClient.setQueryData<Issue[]>(queryKey, (current) =>
                    current?.map((issue) => (issue.identifier === identifier ? { ...issue, ...input } : issue)),
                );
            }

            return { previous };
        },
        onError: (_error, _variables, context) => {
            context?.previous.forEach(([queryKey, previousIssues]) => queryClient.setQueryData(queryKey, previousIssues));
        },
        onSuccess: (issue) => {
            queryClient.invalidateQueries({ queryKey: ["projects", projectId, "issues"] });
            queryClient.invalidateQueries({ queryKey: issueKey(issue.identifier) });
        },
        onSettled: (_data, _error, variables) => queryClient.invalidateQueries({ queryKey: issueKey(variables.identifier) }),
    });
}

export function useDeleteIssue(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: deleteIssue, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId, "issues"] }) });
}

export function useIssueComments(identifier: string | null) {
    return useQuery({ queryKey: [...issueKey(identifier ?? ""), "comments"], queryFn: () => listIssueComments(identifier!), enabled: !!identifier });
}

export function useIssueActivity(identifier: string | null) {
    return useQuery({ queryKey: [...issueKey(identifier ?? ""), "activity"], queryFn: () => listIssueActivity(identifier!), enabled: !!identifier });
}

export function useIssueRelations(identifier: string | null) {
    return useQuery({ queryKey: [...issueKey(identifier ?? ""), "relations"], queryFn: () => listIssueRelations(identifier!), enabled: !!identifier });
}

export function useCycles(projectId: string) {
    return useQuery({ queryKey: ["projects", projectId, "cycles"], queryFn: () => listCycles(projectId), enabled: !!projectId });
}

export function useCreateCycle(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateCycleInput) => createCycle(projectId, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId, "cycles"] }),
    });
}

export function useUpdateCycle(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ cycleId, input }: { cycleId: string; input: UpdateCycleInput }) => updateCycle(cycleId, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId, "cycles"] }),
    });
}

export function useDeleteCycle(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (cycleId: string) => deleteCycle(cycleId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId, "cycles"] }),
    });
}

export function useCreateIssueComment(identifier: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateIssueCommentInput) => createIssueComment(identifier, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [...issueKey(identifier), "comments"] }),
    });
}

export function useUpdateIssueComment(identifier: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ commentId, input }: { commentId: string; input: UpdateIssueCommentInput }) => updateIssueComment(commentId, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [...issueKey(identifier), "comments"] }),
    });
}

export function useDeleteIssueComment(identifier: string) {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: deleteIssueComment, onSuccess: () => queryClient.invalidateQueries({ queryKey: [...issueKey(identifier), "comments"] }) });
}

export function useCreateIssueRelation(identifier: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateIssueRelationInput) => createIssueRelation(identifier, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [...issueKey(identifier), "relations"] }),
    });
}

export function useDeleteIssueRelation(identifier: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteIssueRelation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [...issueKey(identifier), "relations"] }),
    });
}
