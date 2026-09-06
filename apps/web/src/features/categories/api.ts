import type { CreateCategoryInput } from "@gikan/shared";
import { apiClient } from "@/lib/api-client";

export interface Category {
    id: string;
    projectId: string;
    name: string;
    color: string | null;
    createdBy: string;
    createdAt: string;
}

export function listCategories(projectId: string): Promise<Category[]> {
    return apiClient.get<{ categories: Category[] }>(`/projects/${projectId}/categories`).then((res) => res.categories);
}

export function createCategory(projectId: string, input: CreateCategoryInput): Promise<Category> {
    return apiClient.post<{ category: Category }>(`/projects/${projectId}/categories`, input).then((res) => res.category);
}

export function deleteCategory(projectId: string, categoryId: string): Promise<void> {
    return apiClient.delete<void>(`/projects/${projectId}/categories/${categoryId}`);
}
