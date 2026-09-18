import type { CreateColumnInput, UpdateColumnInput } from "@gikan/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type BoardColumn, createColumn, deleteColumn, listColumns, updateColumn } from "../api";

function columnsKey(projectId: string) {
    return ["projects", projectId, "columns"] as const;
}

export function useColumns(projectId: string) {
    return useQuery({ queryKey: columnsKey(projectId), queryFn: () => listColumns(projectId), enabled: !!projectId });
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
        // Optimistic update keeps a reordered column in place while the request settles.
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
