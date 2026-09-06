import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { ErrorMessage } from "@/components/feedback/error-message";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { useCards, useColumns, useUpdateCard } from "../hooks/use-board";
import { AddColumnForm } from "./add-column-form";
import { CardModal, type CardModalTarget } from "./card-modal";
import { Column } from "./column";

export const Board = ({ projectId }: { projectId: string }) => {
    const { data: columns, isLoading: columnsLoading, isError: columnsError } = useColumns(projectId);
    const { data: cards, isLoading: cardsLoading, isError: cardsError } = useCards(projectId);
    const { data: categories } = useCategories(projectId);
    const { data: members } = useProjectMembers(projectId);
    const updateCard = useUpdateCard(projectId);

    const [modalTarget, setModalTarget] = useState<CardModalTarget | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    const categoriesById = useMemo(() => new Map((categories ?? []).map((category) => [category.id, category])), [categories]);
    const membersById = useMemo(() => new Map((members ?? []).map((member) => [member.id, member])), [members]);

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || !cards) return;

        const cardId = String(active.id);
        const targetColumnId = String(over.id);
        const card = cards.find((c) => c.id === cardId);
        if (!card) return;

        const cardsInTarget = cards.filter((c) => c.columnId === targetColumnId && c.id !== cardId).sort((a, b) => a.position - b.position);
        const lastCard = cardsInTarget[cardsInTarget.length - 1];
        const newPosition = lastCard ? lastCard.position + 1000 : 1000;

        if (card.columnId === targetColumnId) return;

        updateCard.mutate({ cardId, input: { columnId: targetColumnId, position: newPosition } });
    }

    if (columnsLoading || cardsLoading) {
        return <p className="text-tertiary">Carregando...</p>;
    }

    if (columnsError || cardsError) {
        return <ErrorMessage message="Não foi possível carregar o board. Você pode não ter acesso a este projeto, ou ele pode não existir." />;
    }

    return (
        <>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="flex h-full items-start gap-4 overflow-x-auto">
                    {columns?.map((column) => (
                        <Column
                            key={column.id}
                            column={column}
                            cards={(cards ?? []).filter((c) => c.columnId === column.id).sort((a, b) => a.position - b.position)}
                            projectId={projectId}
                            categoriesById={categoriesById}
                            membersById={membersById}
                            onOpenCard={(cardId) => setModalTarget({ type: "edit", cardId })}
                            onCreateCard={(columnId) => setModalTarget({ type: "create", columnId })}
                        />
                    ))}
                    <AddColumnForm projectId={projectId} />
                </div>
            </DndContext>

            {modalTarget && <CardModal projectId={projectId} target={modalTarget} onClose={() => setModalTarget(null)} />}
        </>
    );
};
