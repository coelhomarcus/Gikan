import { createCardSchema, updateCardSchema } from "@gikan/shared";
import { AlertCircle, AlignLeft, Calendar, Columns03, Trash01, Type01, User01 } from "@untitledui/icons";
import { type Resolver, useForm } from "react-hook-form";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { ControlledInput } from "@/components/form/controlled-input";
import { ControlledSelect } from "@/components/form/controlled-select";
import { ControlledTextarea } from "@/components/form/controlled-textarea";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { ApiError } from "@/lib/api-client";
import { useColumns, useCreateCard, useDeleteCard, useUpdateCard } from "../hooks/use-board";
import { useCardDetail } from "../hooks/use-card-detail";
import { IMPORTANCE_ITEMS } from "./importance-badge";

const NONE = "__none__";

function initialsOf(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join("");
}

type CardImportance = "low" | "medium" | "high";

interface CardFormValues {
    title: string;
    description?: string | null;
    columnId: string;
    categoryId?: string | null;
    assigneeId?: string | null;
    importance: CardImportance;
}

export type CardModalTarget = { type: "edit"; cardId: string } | { type: "create"; columnId: string };

interface CardModalProps {
    projectId: string;
    target: CardModalTarget;
    onClose: () => void;
}

/**
 * One form (same field layout) serves both modes, but create/edit use different Zod schemas
 * (createCardSchema requires columnId+title, while updateCardSchema makes everything optional).
 * Rather than forcing useForm<T> generics to combine two schemas with different shapes, a manual
 * resolver selects the correct schema at runtime and translates ZodError into RHF's format.
 */
function buildResolver(mode: CardModalTarget["type"]): Resolver<CardFormValues> {
    const schema = mode === "create" ? createCardSchema : updateCardSchema;

    return async (values) => {
        const result = schema.safeParse(values);
        if (result.success) {
            return { values: result.data as CardFormValues, errors: {} };
        }

        const errors: Record<string, { type: string; message: string }> = {};
        for (const issue of result.error.issues) {
            const key = issue.path.join(".") || "root";
            if (!errors[key]) {
                errors[key] = { type: issue.code, message: issue.message };
            }
        }
        return { values: {}, errors };
    };
}

export const CardModal = ({ projectId, target, onClose }: CardModalProps) => {
    const isCreate = target.type === "create";

    const { data: card } = useCardDetail(!isCreate ? target.cardId : null);
    const { data: columns } = useColumns(projectId);
    const { data: members } = useProjectMembers(projectId);
    const { data: categories } = useCategories(projectId);
    const createCard = useCreateCard(projectId);
    const updateCard = useUpdateCard(projectId);
    const deleteCard = useDeleteCard(projectId);

    const { control, handleSubmit, setError, formState } = useForm<CardFormValues>({
        resolver: buildResolver(target.type),
        defaultValues: isCreate
            ? { columnId: target.columnId, title: "", description: null, categoryId: null, assigneeId: null, importance: "medium" }
            : undefined,
        values:
            !isCreate && card
                ? {
                      title: card.title,
                      description: card.description,
                      columnId: card.columnId,
                      categoryId: card.categoryId,
                      assigneeId: card.assigneeId,
                      importance: card.importance,
                  }
                : undefined,
    });

    function onSubmit(data: CardFormValues) {
        if (isCreate) {
            createCard.mutate(data, {
                onSuccess: onClose,
                onError: (error) => {
                    setError("root", { message: error instanceof ApiError ? error.message : "Could not create the issue" });
                },
            });
            return;
        }

        updateCard.mutate(
            { identifier: target.cardId, input: data },
            {
                onSuccess: onClose,
                onError: (error) => {
                    setError("root", { message: error instanceof ApiError ? error.message : "Could not save" });
                },
            },
        );
    }

    const isPending = isCreate ? createCard.isPending : updateCard.isPending;
    const isLoadingDetail = !isCreate && !card;

    return (
        <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="max-w-2xl">
                <Dialog>
                    <div className="flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-xl bg-primary shadow-xl ring-1 ring-secondary">
                        {isLoadingDetail ? (
                            <p className="p-6 text-tertiary">Loading...</p>
                        ) : (
                            <form className="flex flex-col gap-5 p-6" noValidate onSubmit={handleSubmit(onSubmit)}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <ControlledInput control={control} name="title" label="Title" icon={Type01} isRequired autoFocus />
                                    </div>
                                    <CloseButton size="sm" onPress={onClose} className="mt-6" />
                                </div>

                                <ControlledTextarea
                                    control={control}
                                    name="description"
                                    label={
                                        <span className="inline-flex items-center gap-1.5">
                                            <AlignLeft className="size-4" />
                                            Description
                                        </span>
                                    }
                                    rows={4}
                                />

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <ControlledSelect
                                        control={control}
                                        name="columnId"
                                        label="Column"
                                        icon={Columns03}
                                        items={(columns ?? []).map((column) => ({ id: column.id, label: column.name }))}
                                    />
                                    <ControlledSelect control={control} name="importance" label="Importance" items={IMPORTANCE_ITEMS} />
                                    <ControlledSelect
                                        control={control}
                                        name="assigneeId"
                                        label="Assignee"
                                        nullOption={{ id: NONE, label: "Nobody", icon: User01 }}
                                        items={(members ?? []).map((member) => ({
                                            id: member.id,
                                            label: member.name,
                                            supportingText: `@${member.username}`,
                                            avatarUrl: member.avatarUrl ?? undefined,
                                        }))}
                                    />
                                    <ControlledSelect
                                        control={control}
                                        name="categoryId"
                                        label="Category"
                                        nullOption={{ id: NONE, label: "None", icon: <span className="size-2 rounded-full bg-fg-quaternary" /> }}
                                        items={(categories ?? []).map((category) => ({
                                            id: category.id,
                                            label: category.name,
                                            icon: <span className="size-2 rounded-full" style={{ backgroundColor: category.color ?? "#87888c" }} />,
                                        }))}
                                    />
                                </div>

                                {!isCreate && card && (
                                    <div className="flex items-center gap-2 border-t border-secondary pt-4 text-xs text-tertiary">
                                        <Avatar size="xs" src={card.createdBy.avatarUrl ?? undefined} initials={initialsOf(card.createdBy.name)} />
                                        <p>
                                            Created by <span className="font-medium text-tertiary">{card.createdBy.name}</span> on{" "}
                                            <span className="inline-flex items-center gap-1">
                                                <Calendar className="size-3.5" />
                                                {new Date(card.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {formState.errors.root && (
                                    <p className="flex items-center gap-1.5 text-sm text-error-primary">
                                        <AlertCircle className="size-4 shrink-0" />
                                        {formState.errors.root.message}
                                    </p>
                                )}

                                <div className="flex items-center justify-between gap-3">
                                    {isCreate ? (
                                        <div />
                                    ) : (
                                        <ConfirmDialog
                                            trigger={
                                                <Button type="button" color="secondary-destructive" size="sm" iconLeading={Trash01}>
                                                    Delete
                                                </Button>
                                            }
                                            title="Delete issue"
                                            description={`The issue "${card?.title ?? ""}" will be deleted. This action cannot be undone.`}
                                            confirmLabel="Delete issue"
                                            isPending={deleteCard.isPending}
                                            onConfirm={() => deleteCard.mutate(target.cardId, { onSuccess: onClose })}
                                        />
                                    )}

                                    <div className="flex gap-3">
                                        <Button type="button" color="secondary" onClick={onClose}>
                                            Close
                                        </Button>
                                        <Button type="submit" isLoading={isPending}>
                                            {isCreate ? "Create issue" : "Save"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
