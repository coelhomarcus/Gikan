import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { ErrorMessage } from "@/components/feedback/error-message";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import type { BoardCard } from "../api";
import { useCards, useColumns, useUpdateCard } from "../hooks/use-board";
import { AddColumnForm } from "./add-column-form";
import { CardModal, type CardModalTarget } from "./card-modal";
import { Column } from "./column";

/** Calcula a `position` (gaps de 1000, mesmo esquema usado pelas colunas) pro card entrar no índice `index` de `siblings` (já ordenados, sem o próprio card). */
function positionAtIndex(siblings: BoardCard[], index: number): number {
    const before = siblings[index - 1];
    const after = siblings[index];
    if (!before && !after) return 1000;
    if (!before) return after.position / 2;
    if (!after) return before.position + 1000;
    return (before.position + after.position) / 2;
}

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
        const overId = String(over.id);
        if (cardId === overId) return;

        const card = cards.find((c) => c.id === cardId);
        if (!card) return;

        const isOverColumn = columns?.some((c) => c.id === overId);
        const overCard = isOverColumn ? undefined : cards.find((c) => c.id === overId);
        if (!isOverColumn && !overCard) return;

        const targetColumnId = isOverColumn ? overId : overCard!.columnId;
        const siblings = cards.filter((c) => c.columnId === targetColumnId && c.id !== cardId).sort((a, b) => a.position - b.position);

        let targetIndex: number;
        if (isOverColumn) {
            targetIndex = siblings.length;
        } else {
            const overIndex = siblings.findIndex((c) => c.id === overId);
            const activeRect = active.rect.current.translated ?? active.rect.current.initial;
            const isBelow = activeRect ? activeRect.top + activeRect.height / 2 > over.rect.top + over.rect.height / 2 : false;
            targetIndex = isBelow ? overIndex + 1 : overIndex;
        }

        const newPosition = positionAtIndex(siblings, targetIndex);

        if (card.columnId === targetColumnId && card.position === newPosition) return;

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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
