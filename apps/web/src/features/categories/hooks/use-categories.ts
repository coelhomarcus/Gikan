import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCategoryInput } from "@gikan/shared";
import { createCategory, deleteCategory, listCategories } from "../api";

export function categoriesQueryKey(projectId: string) {
    return ["projects", projectId, "categories"] as const;
}

export function useCategories(projectId: string) {
    return useQuery({
        queryKey: categoriesQueryKey(projectId),
        queryFn: () => listCategories(projectId),
        enabled: !!projectId,
    });
}

export function useCreateCategory(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateCategoryInput) => createCategory(projectId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoriesQueryKey(projectId) });
        },
    });
}

export function useDeleteCategory(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (categoryId: string) => deleteCategory(projectId, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoriesQueryKey(projectId) });
        },
    });
}
