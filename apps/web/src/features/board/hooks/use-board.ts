import type { CreateCardInput, CreateColumnInput, UpdateCardInput, UpdateColumnInput } from "@todokanban/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    type BoardCard,
    createCard,
    createColumn,
    deleteCard,
    deleteColumn,
    listCards,
    listColumns,
    updateCard,
    updateColumn,
} from "../api";

function columnsKey(projectId: string) {
    return ["projects", projectId, "columns"] as const;
}

function cardsKey(projectId: string) {
    return ["projects", projectId, "cards"] as const;
}

export function useColumns(projectId: string) {
    return useQuery({ queryKey: columnsKey(projectId), queryFn: () => listColumns(projectId), enabled: !!projectId });
}

export function useCards(projectId: string) {
    return useQuery({ queryKey: cardsKey(projectId), queryFn: () => listCards(projectId), enabled: !!projectId });
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
        onSuccess: () => queryClient.invalidateQueries({ queryKey: columnsKey(projectId) }),
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
        mutationFn: ({ cardId, input }: { cardId: string; input: UpdateCardInput }) => updateCard(cardId, input),
        onMutate: async ({ cardId, input }) => {
            await queryClient.cancelQueries({ queryKey: cardsKey(projectId) });
            const previous = queryClient.getQueryData<BoardCard[]>(cardsKey(projectId));

            queryClient.setQueryData<BoardCard[]>(cardsKey(projectId), (old) =>
                old?.map((card) => (card.id === cardId ? { ...card, ...input } : card)),
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
            queryClient.invalidateQueries({ queryKey: ["cards", variables.cardId] });
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
