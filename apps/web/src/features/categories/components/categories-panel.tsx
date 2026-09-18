import { type CreateCategoryInput, createCategorySchema } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash01 } from "@untitledui/icons";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { ControlledInput } from "@/components/form/controlled-input";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { cx } from "@/utils/cx";
import { useCategories, useCreateCategory, useDeleteCategory } from "../hooks/use-categories";
import { CATEGORY_COLORS, CategoryBadge } from "./category-badge";

interface CategoriesPanelProps {
    projectId: string;
    isProjectOwner: boolean;
}

export const CategoriesPanel = ({ projectId, isProjectOwner }: CategoriesPanelProps) => {
    const { user } = useAuth();
    const { data: categories, isLoading, isError } = useCategories(projectId);
    const createMutation = useCreateCategory(projectId);
    const deleteMutation = useDeleteCategory(projectId);

    const { control, handleSubmit, reset, setError, formState } = useForm<CreateCategoryInput>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: { name: "", color: CATEGORY_COLORS[0] },
    });

    return (
        <div className="flex flex-col gap-6">
            <form
                className="flex flex-col gap-4 rounded-xl border border-secondary p-4"
                noValidate
                onSubmit={handleSubmit((data) => {
                    createMutation.mutate(data, {
                        onSuccess: () => reset({ name: "", color: CATEGORY_COLORS[0] }),
                        onError: (error) => {
                            setError("root", { message: error instanceof ApiError ? error.message : "Could not create the category" });
                        },
                    });
                })}
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <ControlledInput control={control} name="name" label="New category" placeholder="e.g. Bug" isRequired />
                    </div>
                    <Button type="submit" isLoading={createMutation.isPending}>
                        Add
                    </Button>
                </div>

                <Controller
                    control={control}
                    name="color"
                    render={({ field }) => (
                        <div className="flex items-center gap-2">
                            {CATEGORY_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    aria-label={`Color ${color}`}
                                    onClick={() => field.onChange(color)}
                                    className={cx(
                                        "size-6 shrink-0 rounded-full outline-offset-2 transition duration-100 ease-linear",
                                        field.value === color && "outline-2 outline-fg-primary",
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    )}
                />

                {formState.errors.root && <p className="text-sm text-error-primary">{formState.errors.root.message}</p>}
            </form>

            {isLoading && <LoadingState label="Loading labels..." />}
            {isError && <ErrorMessage message="Could not load the project categories." />}

            {categories && categories.length === 0 && <EmptyState title="No labels yet" description="Create a label to organize issues in this project." />}

            {categories && categories.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {categories.map((category) => {
                        const canDelete = isProjectOwner || category.createdBy === user?.id;

                        return (
                            <li key={category.id} className="flex items-center justify-between gap-3 rounded-lg border border-secondary px-3 py-2">
                                <CategoryBadge category={category} />
                                {canDelete && (
                                    <ConfirmDialog
                                        trigger={<ButtonUtility icon={Trash01} size="sm" color="tertiary" tooltip="Delete" />}
                                        title="Delete category"
                                        description={`The category "${category.name}" will be deleted and removed from the issues that use it. This action cannot be undone.`}
                                        confirmLabel="Delete category"
                                        isPending={deleteMutation.isPending}
                                        onConfirm={() => deleteMutation.mutate(category.id)}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
