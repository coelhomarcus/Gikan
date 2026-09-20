import type {
    CreateIssueCommentInput,
    CreateIssueInput,
    CreateIssueRelationInput,
    IssueListQuery,
    UpdateIssueCommentInput,
    UpdateIssueInput,
} from "@gikan/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Issue, IssueDetail } from "../api";
import { issueDescriptionDrafts } from "../lib/issue-description-drafts";
import { useAuth } from "@/features/auth/hooks/use-auth";
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
type IssueUpdateField = Exclude<keyof UpdateIssueInput, "expectedDescriptionRevision">;

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
            const { expectedDescriptionRevision: _expectedDescriptionRevision, ...inputValues } = input;
            const optimisticValues: Partial<Pick<Issue, IssueUpdateField>> = inputValues;
            await Promise.all([
                queryClient.cancelQueries({ queryKey: ["projects", projectId, "issues"] }),
                queryClient.cancelQueries({ queryKey: issueKey(identifier) }),
            ]);
            const previous = queryClient.getQueriesData<Issue[]>({ queryKey: ["projects", projectId, "issues"] });
            const previousDetail = queryClient.getQueryData<IssueDetail>(issueKey(identifier));

            for (const [queryKey] of previous) {
                queryClient.setQueryData<Issue[]>(queryKey, (current) =>
                    current?.map((issue) => (issue.identifier === identifier ? { ...issue, ...optimisticValues } : issue)),
                );
            }
            queryClient.setQueryData<IssueDetail>(issueKey(identifier), (current) => current ? { ...current, ...optimisticValues } : current);

            return { previous, previousDetail, optimisticValues };
        },
        onError: (_error, variables, context) => {
            if (!context) return;
            const fields = Object.keys(context.optimisticValues) as IssueUpdateField[];
            context.previous.forEach(([queryKey, previousIssues]) => {
                queryClient.setQueryData<Issue[]>(queryKey, (current) => {
                    if (!current || !previousIssues) return current;
                    return current.map((issue) => {
                        if (issue.identifier !== variables.identifier) return issue;
                        const previousIssue = previousIssues.find((entry) => entry.identifier === variables.identifier);
                        if (!previousIssue) return issue;
                        const rollback: Partial<Pick<Issue, IssueUpdateField>> = {};
                        for (const field of fields) {
                            if (Object.is(issue[field], context.optimisticValues[field])) {
                                (rollback as Record<string, unknown>)[field] = previousIssue[field as keyof Issue];
                            }
                        }
                        return { ...issue, ...rollback };
                    });
                });
            });
            if (context.previousDetail) {
                queryClient.setQueryData<IssueDetail>(issueKey(variables.identifier), (current) => {
                    if (!current) return current;
                    const rollback: Partial<Pick<IssueDetail, IssueUpdateField>> = {};
                    for (const field of fields) {
                        if (Object.is(current[field], context.optimisticValues[field])) {
                            (rollback as Record<string, unknown>)[field] = context.previousDetail?.[field];
                        }
                    }
                    return { ...current, ...rollback };
                });
            }
        },
        onSuccess: (issue) => {
            const { createdBy: _createdBy, ...updatedFields } = issue;
            queryClient.setQueryData<IssueDetail>(issueKey(issue.identifier), (current) => current ? { ...current, ...updatedFields } : current);
            queryClient.invalidateQueries({ queryKey: ["projects", projectId, "issues"] });
            queryClient.invalidateQueries({ queryKey: issueKey(issue.identifier) });
        },
        onSettled: (_data, _error, variables) => queryClient.invalidateQueries({ queryKey: issueKey(variables.identifier) }),
    });
}

export function useDeleteIssue(projectId: string) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: deleteIssue,
        onSuccess: async (_result, identifier) => {
            const detail = queryClient.getQueryData<IssueDetail>(issueKey(identifier));
            const lists = queryClient.getQueriesData<Issue[]>({ queryKey: ["projects", projectId, "issues"] });
            const issue = detail ?? lists.flatMap(([, entries]) => entries ?? []).find((entry) => entry.identifier === identifier);
            if (user && issue) await issueDescriptionDrafts.clearIssue(user.id, issue.projectId, issue.id).catch(() => undefined);
            queryClient.removeQueries({ queryKey: issueKey(identifier), exact: true });
            await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "issues"] });
        },
    });
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
