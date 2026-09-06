import { zodResolver } from "@hookform/resolvers/zod";
import { type UpdateCardInput, updateCardSchema } from "@todokanban/shared";
import { Trash01 } from "@untitledui/icons";
import { useForm } from "react-hook-form";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { ControlledInput } from "@/components/form/controlled-input";
import { ControlledSelect } from "@/components/form/controlled-select";
import { ControlledTextarea } from "@/components/form/controlled-textarea";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { ApiError } from "@/lib/api-client";
import { useColumns, useDeleteCard, useUpdateCard } from "../hooks/use-board";
import { useCardDetail } from "../hooks/use-card-detail";
import { DIFFICULTY_ITEMS } from "./difficulty-badge";

const NONE = "__none__";

interface CardModalProps {
    projectId: string;
    cardId: string;
    onClose: () => void;
}

export const CardModal = ({ projectId, cardId, onClose }: CardModalProps) => {
    const { data: card } = useCardDetail(cardId);
    const { data: columns } = useColumns(projectId);
    const { data: members } = useProjectMembers(projectId);
    const { data: categories } = useCategories(projectId);
    const updateCard = useUpdateCard(projectId);
    const deleteCard = useDeleteCard(projectId);

    const { control, handleSubmit, setError, formState } = useForm<UpdateCardInput>({
        resolver: zodResolver(updateCardSchema),
        values: card
            ? {
                  title: card.title,
                  description: card.description,
                  columnId: card.columnId,
                  categoryId: card.categoryId ?? NONE,
                  assigneeId: card.assigneeId ?? NONE,
                  difficulty: card.difficulty,
              }
            : undefined,
    });

    function onSubmit(data: UpdateCardInput) {
        updateCard.mutate(
            {
                cardId,
                input: {
                    ...data,
                    categoryId: data.categoryId === NONE ? null : data.categoryId,
                    assigneeId: data.assigneeId === NONE ? null : data.assigneeId,
                },
            },
            {
                onError: (error) => {
                    setError("root", { message: error instanceof ApiError ? error.message : "Não foi possível salvar" });
                },
            },
        );
    }

    return (
        <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="max-w-2xl">
                <Dialog>
                    <div className="flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-xl bg-primary shadow-xl ring-1 ring-secondary">
                        {!card ? (
                            <p className="p-6 text-tertiary">Carregando...</p>
                        ) : (
                            <form className="flex flex-col gap-5 p-6" noValidate onSubmit={handleSubmit(onSubmit)}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <ControlledInput control={control} name="title" label="Título" isRequired />
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
                                    <ControlledSelect
                                        control={control}
                                        name="difficulty"
                                        label="Dificuldade"
                                        items={DIFFICULTY_ITEMS}
                                    />
                                    <ControlledSelect
                                        control={control}
                                        name="assigneeId"
                                        label="Responsável"
                                        items={[
                                            { id: NONE, label: "Ninguém" },
                                            ...(members ?? []).map((member) => ({ id: member.id, label: member.name, supportingText: `@${member.username}` })),
                                        ]}
                                    />
                                    <ControlledSelect
                                        control={control}
                                        name="categoryId"
                                        label="Categoria"
                                        items={[
                                            { id: NONE, label: "Nenhuma" },
                                            ...(categories ?? []).map((category) => ({ id: category.id, label: category.name })),
                                        ]}
                                    />
                                </div>

                                <div className="flex flex-col gap-1 border-t border-secondary pt-4 text-xs text-tertiary">
                                    <p>
                                        Criado por <span className="font-medium text-tertiary">{card.createdBy.name}</span> em{" "}
                                        {new Date(card.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                    </p>
                                </div>

                                {formState.errors.root && <p className="text-sm text-error-primary">{formState.errors.root.message}</p>}

                                <div className="flex items-center justify-between gap-3">
                                    <Button
                                        type="button"
                                        color="secondary-destructive"
                                        size="sm"
                                        iconLeading={Trash01}
                                        onClick={() => {
                                            deleteCard.mutate(cardId, { onSuccess: onClose });
                                        }}
                                    >
                                        Excluir
                                    </Button>

                                    <div className="flex gap-3">
                                        <Button type="button" color="secondary" onClick={onClose}>
                                            Fechar
                                        </Button>
                                        <Button type="submit" isLoading={updateCard.isPending}>
                                            Salvar
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
