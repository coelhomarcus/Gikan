import type { CreateCardInput, CreateColumnInput, UpdateCardInput, UpdateColumnInput } from "@gikan/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Issue } from "@/features/issues/api";
import { issueKey, issuesKey } from "@/features/issues/hooks/use-issues";
import {
    type BoardColumn,
    createCard,
    createColumn,
    deleteCard,
    deleteColumn,
    listColumns,
    updateCard,
    updateColumn,
} from "../api";
import { listIssues } from "@/features/issues/api";

function columnsKey(projectId: string) {
    return ["projects", projectId, "columns"] as const;
}

function cardsKey(projectId: string) {
    return issuesKey(projectId, { orderBy: "position" });
}

export function useColumns(projectId: string) {
    return useQuery({ queryKey: columnsKey(projectId), queryFn: () => listColumns(projectId), enabled: !!projectId });
}

export function useCards(projectId: string) {
    return useQuery({ queryKey: cardsKey(projectId), queryFn: () => listIssues(projectId, { orderBy: "position" }), enabled: !!projectId });
}

export function useCreateColumn(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateColumnInput) => createColumn(projectId, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: columnsKey(projectId) }),
    });
}

export function useUpdateColumn(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ columnId, input }: { columnId: string; input: UpdateColumnInput }) => updateColumn(projectId, columnId, input),
        // Optimistic update (same pattern as `useUpdateCard`): without it, a reordered column
        // returns to its old position until the refetch completes. The `sort` is needed because
        // the board renders columns in array order — changing only `position` would not reorder them.
        onMutate: async ({ columnId, input }) => {
            await queryClient.cancelQueries({ queryKey: columnsKey(projectId) });
            const previous = queryClient.getQueryData<BoardColumn[]>(columnsKey(projectId));

            queryClient.setQueryData<BoardColumn[]>(columnsKey(projectId), (old) =>
                old?.map((column) => (column.id === columnId ? { ...column, ...input } : column)).sort((a, b) => a.position - b.position),
            );

            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(columnsKey(projectId), context.previous);
            }
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: columnsKey(projectId) }),
    });
}

export function useDeleteColumn(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (columnId: string) => deleteColumn(projectId, columnId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: columnsKey(projectId) }),
    });
}

export function useCreateCard(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateCardInput) => createCard(projectId, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: cardsKey(projectId) }),
    });
}

export function useUpdateCard(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ identifier, input }: { identifier: string; input: UpdateCardInput }) => updateCard(identifier, input),
        onMutate: async ({ identifier, input }) => {
            await queryClient.cancelQueries({ queryKey: cardsKey(projectId) });
            const previous = queryClient.getQueryData<Issue[]>(cardsKey(projectId));
            const { importance, description: _description, ...issueInput } = input;

            queryClient.setQueryData<Issue[]>(cardsKey(projectId), (old) =>
                old?.map((issue) =>
                    (issue.id === identifier || issue.identifier === identifier)
                        ? {
                              ...issue,
                              ...issueInput,
                              ...(importance ? { priority: importance } : {}),
                          }
                        : issue,
                ),
            );

            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(cardsKey(projectId), context.previous);
            }
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: cardsKey(projectId) });
            queryClient.invalidateQueries({ queryKey: issueKey(variables.identifier) });
            queryClient.invalidateQueries({ queryKey: ["cards", variables.identifier] });
        },
    });
}

export function useDeleteCard(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (cardId: string) => deleteCard(cardId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: cardsKey(projectId) }),
    });
}
