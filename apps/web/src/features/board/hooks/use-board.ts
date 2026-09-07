import type { CreateCardInput, CreateColumnInput, UpdateCardInput, UpdateColumnInput } from "@gikan/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    type BoardCard,
    type BoardColumn,
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
        // Atualização otimista (mesmo padrão de `useUpdateCard`): sem isso, ao reordenar a coluna
        // ela volta pro lugar antigo até o refetch chegar. O `sort` é necessário porque o board
        // renderiza as colunas na ordem do array — mudar só a `position` não reordenaria nada.
        onMutate: async ({ columnId, input }) => {
            await queryClient.cancelQueries({ queryKey: columnsKey(projectId) });
            const previous = queryClient.getQueryData<BoardColumn[]>(columnsKey(projectId));

            queryClient.setQueryData<BoardColumn[]>(columnsKey(projectId), (old) =>
                old
                    ?.map((column) => (column.id === columnId ? { ...column, ...input } : column))
                    .sort((a, b) => a.position - b.position),
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
