import { useState } from "react";
import { EditOutline as Pencil, AddOutline as Plus, DeleteOutline as Trash2 } from "@makeplane/propel/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Alert } from "@/components/base/feedback/alert";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import { NamedColorForm } from "@/components/settings/named-color-form";
import { SettingsHeading } from "@/components/settings/settings-layout";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "../hooks/use-categories";
import { CATEGORY_COLORS } from "./category-badge";

export const CategoriesPanel = ({ projectId, isProjectOwner }: { projectId: string; isProjectOwner: boolean }) => {
    const { user } = useAuth();
    const { data: categories, isLoading, isError } = useCategories(projectId);
    const createMutation = useCreateCategory(projectId);
    const deleteMutation = useDeleteCategory(projectId);
    const updateMutation = useUpdateCategory(projectId);
    const [editor, setEditor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    return (
        <div className="space-y-6">
            <SettingsHeading
                title="Labels"
                description="Create labels to help organize and filter issues in your project."
                control={
                    <Button size="lg" iconLeading={Plus} isDisabled={pending || !!editor} onClick={() => setEditor("new")}>
                        Add label
                    </Button>
                }
            />
            {error && <Alert tone="error">{error}</Alert>}
            {editor === "new" && (
                <NamedColorForm
                    key="new"
                    label="Label name"
                    initialColor={CATEGORY_COLORS[0]}
                    submitLabel="Add label"
                    onSave={(input) => createMutation.mutateAsync({ ...input, color: input.color ?? CATEGORY_COLORS[0] })}
                    onClose={() => setEditor(null)}
                />
            )}
            {isLoading && <LoadingState label="Loading labels..." />}
            {isError && <ErrorMessage message="Could not load the project labels." />}
            {categories?.length === 0 && editor !== "new" && (
                <EmptyState title="No labels yet" description="Create a label to organize issues in this project." />
            )}
            <ul className="space-y-2">
                {categories?.map((category) => {
                    const editable = isProjectOwner || category.createdBy === user?.id;
                    return (
                        <li key={category.id}>
                            {editor === category.id ? (
                                <NamedColorForm
                                    label="Label name"
                                    initialName={category.name}
                                    initialColor={category.color}
                                    submitLabel="Save"
                                    onSave={(input) => updateMutation.mutateAsync({ categoryId: category.id, input })}
                                    onClose={() => setEditor(null)}
                                />
                            ) : (
                                <div className="group flex min-h-12 items-center justify-between gap-3 rounded-sm border border-subtle bg-surface-1 px-3.5 py-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color ?? CATEGORY_COLORS[0] }} />
                                        <span className="truncate text-sm text-secondary">{category.name}</span>
                                    </div>
                                    {editable && (
                                        <div className="flex shrink-0 items-center gap-1 opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 md:opacity-0">
                                            <ButtonUtility
                                                icon={Pencil}
                                                size="sm"
                                                color="tertiary"
                                                tooltip={`Edit ${category.name}`}
                                                isDisabled={pending || !!editor}
                                                onClick={() => setEditor(category.id)}
                                            />
                                            <ConfirmDialog
                                                trigger={<ButtonUtility icon={Trash2} size="sm" color="tertiary" tooltip="Delete label" isDisabled={pending} />}
                                                title="Delete label"
                                                description={`The label "${category.name}" will be removed from all issues. The issues will not be deleted.`}
                                                confirmLabel="Delete label"
                                                isPending={deleteMutation.isPending}
                                                onConfirm={() => {
                                                    setError(null);
                                                    deleteMutation.mutate(category.id, {
                                                        onError: (reason) =>
                                                            setError(reason instanceof ApiError ? reason.message : "Could not delete the label."),
                                                    });
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
