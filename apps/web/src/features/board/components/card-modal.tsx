import { createCardSchema, updateCardSchema } from "@todokanban/shared";
import { Trash01 } from "@untitledui/icons";
import { type Resolver, useForm } from "react-hook-form";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { ControlledInput } from "@/components/form/controlled-input";
import { ControlledSelect } from "@/components/form/controlled-select";
import { ControlledTextarea } from "@/components/form/controlled-textarea";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { ApiError } from "@/lib/api-client";
import { useColumns, useCreateCard, useDeleteCard, useUpdateCard } from "../hooks/use-board";
import { useCardDetail } from "../hooks/use-card-detail";
import { DIFFICULTY_ITEMS } from "./difficulty-badge";

const NONE = "__none__";

type CardDifficulty = "low" | "medium" | "high";

interface CardFormValues {
    title: string;
    description?: string | null;
    columnId: string;
    categoryId?: string | null;
    assigneeId?: string | null;
    difficulty: CardDifficulty;
}

export type CardModalTarget = { type: "edit"; cardId: string } | { type: "create"; columnId: string };

interface CardModalProps {
    projectId: string;
    target: CardModalTarget;
    onClose: () => void;
}

/**
 * Um único form (mesmo layout de campos) serve os dois modos, mas create/edit usam schemas Zod
 * diferentes (createCardSchema exige columnId+title, updateCardSchema tem tudo opcional). Em vez
 * de lutar com generics de useForm<T> pra unir dois schemas com shapes diferentes, escrevemos um
 * resolver manual que escolhe o schema certo em runtime e traduz ZodError pro formato do RHF.
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
            ? { columnId: target.columnId, title: "", description: null, categoryId: null, assigneeId: null, difficulty: "medium" }
            : undefined,
        values:
            !isCreate && card
                ? {
                      title: card.title,
                      description: card.description,
                      columnId: card.columnId,
                      categoryId: card.categoryId,
                      assigneeId: card.assigneeId,
                      difficulty: card.difficulty,
                  }
                : undefined,
    });

    function onSubmit(data: CardFormValues) {
        if (isCreate) {
            createCard.mutate(data, {
                onSuccess: onClose,
                onError: (error) => {
                    setError("root", { message: error instanceof ApiError ? error.message : "Não foi possível criar o card" });
                },
            });
            return;
        }

        updateCard.mutate(
            { cardId: target.cardId, input: data },
            {
                onError: (error) => {
                    setError("root", { message: error instanceof ApiError ? error.message : "Não foi possível salvar" });
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
                            <p className="p-6 text-tertiary">Carregando...</p>
                        ) : (
                            <form className="flex flex-col gap-5 p-6" noValidate onSubmit={handleSubmit(onSubmit)}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <ControlledInput control={control} name="title" label="Título" isRequired autoFocus />
                                    </div>
                                    <CloseButton size="sm" onPress={onClose} className="mt-6" />
                                </div>

                                <ControlledTextarea control={control} name="description" label="Descrição" rows={4} />

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <ControlledSelect
                                        control={control}
                                        name="columnId"
                                        label="Coluna"
                                        items={(columns ?? []).map((column) => ({ id: column.id, label: column.name }))}
                                    />
                                    <ControlledSelect control={control} name="difficulty" label="Dificuldade" items={DIFFICULTY_ITEMS} />
                                    <ControlledSelect
                                        control={control}
                                        name="assigneeId"
                                        label="Responsável"
                                        nullOption={{ id: NONE, label: "Ninguém" }}
                                        items={(members ?? []).map((member) => ({ id: member.id, label: member.name, supportingText: `@${member.username}` }))}
                                    />
                                    <ControlledSelect
                                        control={control}
                                        name="categoryId"
                                        label="Categoria"
                                        nullOption={{ id: NONE, label: "Nenhuma" }}
                                        items={(categories ?? []).map((category) => ({ id: category.id, label: category.name }))}
                                    />
                                </div>

                                {!isCreate && card && (
                                    <div className="flex flex-col gap-1 border-t border-secondary pt-4 text-xs text-tertiary">
                                        <p>
                                            Criado por <span className="font-medium text-tertiary">{card.createdBy.name}</span> em{" "}
                                            {new Date(card.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                        </p>
                                    </div>
                                )}

                                {formState.errors.root && <p className="text-sm text-error-primary">{formState.errors.root.message}</p>}

                                <div className="flex items-center justify-between gap-3">
                                    {isCreate ? (
                                        <div />
                                    ) : (
                                        <Button
                                            type="button"
                                            color="secondary-destructive"
                                            size="sm"
                                            iconLeading={Trash01}
                                            onClick={() => {
                                                deleteCard.mutate(target.cardId, { onSuccess: onClose });
                                            }}
                                        >
                                            Excluir
                                        </Button>
                                    )}

                                    <div className="flex gap-3">
                                        <Button type="button" color="secondary" onClick={onClose}>
                                            Fechar
                                        </Button>
                                        <Button type="submit" isLoading={isPending}>
                                            {isCreate ? "Criar card" : "Salvar"}
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
