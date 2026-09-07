import { closestCenter, DndContext, DragOverlay, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { ErrorMessage } from "@/components/feedback/error-message";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import type { BoardCard } from "../api";
import { useCards, useColumns, useUpdateCard } from "../hooks/use-board";
import { AddColumnForm } from "./add-column-form";
import { CardItemContent } from "./card-item";
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
    const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
    const [activeCardWidth, setActiveCardWidth] = useState<number>();

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    const categoriesById = useMemo(() => new Map((categories ?? []).map((category) => [category.id, category])), [categories]);
    const membersById = useMemo(() => new Map((members ?? []).map((member) => [member.id, member])), [members]);

    /**
     * Cada coluna tem seu próprio SortableContext, então o `transform` do `useSortable` do card
     * só sabe seguir o cursor DENTRO da coluna de origem — assim que o mouse passa pra outra
     * coluna, o card fica sem transform nenhum (parece "sumir", parado e semitransparente) até
     * soltar. O DragOverlay do dnd-kit resolve isso: é um clone renderizado fora do fluxo normal
     * (via portal), posicionado pelo próprio DndContext a partir do ponteiro, independente de
     * qual coluna/SortableContext está por baixo no momento.
     */
    function handleDragStart(event: DragStartEvent) {
        const card = cards?.find((c) => c.id === event.active.id);
        setActiveCard(card ?? null);

        // `active.rect.current.initial` às vezes ainda não foi medido neste exato frame;
        // ler a largura direto do elemento (já existe no DOM nesse momento) é mais confiável.
        const node = document.querySelector<HTMLElement>(`[data-card-id="${event.active.id}"]`);
        setActiveCardWidth(node?.getBoundingClientRect().width ?? event.active.rect.current.initial?.width);
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveCard(null);

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

    const activeCategory = activeCard?.categoryId ? categoriesById.get(activeCard.categoryId) : undefined;
    const activeAssignee = activeCard?.assigneeId ? membersById.get(activeCard.assigneeId) : undefined;

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveCard(null)}
            >
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

                <DragOverlay>
                    {activeCard && (
                        <div
                            style={{ width: activeCardWidth }}
                            className="flex cursor-grabbing flex-col gap-2 rounded-lg bg-primary p-3 shadow-lg ring-2 ring-brand"
                        >
                            <CardItemContent card={activeCard} category={activeCategory} assignee={activeAssignee} />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {modalTarget && <CardModal projectId={projectId} target={modalTarget} onClose={() => setModalTarget(null)} />}
        </>
    );
};
