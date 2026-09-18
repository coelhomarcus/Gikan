import { useMemo, useState } from "react";
import {
    type CollisionDetection,
    DndContext,
    type DragEndEvent,
    type DragOverEvent,
    DragOverlay,
    type DragStartEvent,
    MeasuringStrategy,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ErrorMessage } from "@/components/feedback/error-message";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import type { BoardCard } from "../api";
import { useCards, useColumns, useUpdateCard } from "../hooks/use-board";
import { positionAtIndex } from "../position";
import { AddColumnForm } from "./add-column-form";
import { CardItemContent } from "./card-item";
import { CardModal, type CardModalTarget } from "./card-modal";
import { Column } from "./column";
import { columnTint } from "./column-color";

/**
 * On a board, what matters is literally beneath the cursor (`pointerWithin`) — much more
 * predictable than center distance, which can choose the wrong target for a small card inside a
 * tall column. `rectIntersection` covers the case where the cursor falls in a gap between columns.
 */
const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

/** Columns change size as cards enter and leave during a drag, so their rectangles must be measured continuously. */
const measuring = { droppable: { strategy: MeasuringStrategy.Always } };

export const Board = ({ projectId }: { projectId: string }) => {
    const { data: columns, isLoading: columnsLoading, isError: columnsError } = useColumns(projectId);
    const { data: cards, isLoading: cardsLoading, isError: cardsError } = useCards(projectId);
    const { data: categories } = useCategories(projectId);
    const { data: members } = useProjectMembers(projectId);
    const updateCard = useUpdateCard(projectId);

    const [modalTarget, setModalTarget] = useState<CardModalTarget | null>(null);
    const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
    const [activeCardWidth, setActiveCardWidth] = useState<number>();
    const [dragCards, setDragCards] = useState<BoardCard[] | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    const categoriesById = useMemo(() => new Map((categories ?? []).map((category) => [category.id, category])), [categories]);
    const membersById = useMemo(() => new Map((members ?? []).map((member) => [member.id, member])), [members]);

    /**
     * Flat list of all cards, already in visual order (columns only filter; they do not sort).
     * During a drag, `dragCards` is reordered in `onDragOver` so columns live-preview where the
     * card will land instead of making the user drag blindly.
     */
    const board = useMemo(() => dragCards ?? [...(cards ?? [])].sort((a, b) => a.position - b.position), [dragCards, cards]);

    /** Resolves the target column: `over` is the column itself (card area) or a card inside it. */
    function resolveColumnId(overId: string, list: BoardCard[]): string | undefined {
        if (columns?.some((column) => column.id === overId)) return overId;
        return list.find((card) => card.id === overId)?.columnId;
    }

    function handleDragStart(event: DragStartEvent) {
        const activeId = String(event.active.id);
        setActiveCard(board.find((card) => card.id === activeId) ?? null);
        setDragCards(board);

        // `active.rect.current.initial` is sometimes not measured in this frame yet; reading the
        // width directly from the element (still in the DOM here) is more reliable for the overlay clone.
        const node = document.querySelector<HTMLElement>(`[data-card-id="${activeId}"]`);
        setActiveCardWidth(node?.getBoundingClientRect().width ?? event.active.rect.current.initial?.width);
    }

    /**
     * Handles only COLUMN CHANGES: moves the card to the hovered column's list while dragging,
     * making the source column close the gap and the destination open space live. Reordering
     * within the same column is handled by `SortableContext` (visual transform) and is finalized
     * on drop — changing state here would cause a double movement.
     */
    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        setDragCards((current) => {
            const list = current ?? board;
            const dragged = list.find((card) => card.id === activeId);
            const targetColumnId = resolveColumnId(overId, list);

            if (!dragged || !targetColumnId || dragged.columnId === targetColumnId) return current;

            const withoutDragged = list.filter((card) => card.id !== activeId);
            const overIndex = withoutDragged.findIndex((card) => card.id === overId);
            const insertAt = overIndex === -1 ? withoutDragged.length : overIndex;

            return [...withoutDragged.slice(0, insertAt), { ...dragged, columnId: targetColumnId }, ...withoutDragged.slice(insertAt)];
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        const list = dragCards ?? board;

        setActiveCard(null);

        if (!over) {
            setDragCards(null);
            return;
        }

        const activeId = String(active.id);
        const overId = String(over.id);

        const targetColumnId = resolveColumnId(overId, list);
        if (!targetColumnId) {
            setDragCards(null);
            return;
        }

        // `arrayMove` is the same operation SortableContext uses for the visual preview, so the
        // drop result matches exactly the gap the user was seeing.
        const columnCards = list.filter((card) => card.columnId === targetColumnId);
        const fromIndex = columnCards.findIndex((card) => card.id === activeId);

        // Only another card provides a specific index; dropping on the column means "at the end".
        const overCardIndex = columnCards.findIndex((card) => card.id === overId);
        const toIndex = overCardIndex === -1 ? columnCards.length - 1 : overCardIndex;
        if (fromIndex === -1 || toIndex === -1) {
            setDragCards(null);
            return;
        }

        const ordered = arrayMove(columnCards, fromIndex, toIndex);
        const finalIndex = ordered.findIndex((card) => card.id === activeId);
        const position = positionAtIndex(
            ordered.filter((card) => card.id !== activeId),
            finalIndex,
        );

        const original = cards?.find((card) => card.id === activeId);
        if (original && original.columnId === targetColumnId && original.position === position) {
            setDragCards(null);
            return;
        }

        // Keep the drag preview (`dragCards`) until the mutation settles instead of clearing it:
        // `useUpdateCard`'s `onMutate` writes to the cache asynchronously, so clearing it first
        // would make the board fall back to old `cards` for one frame — the card would "return"
        // and only then move to the right place. Freezing the preview makes the board optimistic
        // immediately and only reverts on error.
        updateCard.mutate({ cardId: activeId, input: { columnId: targetColumnId, position } }, { onSettled: () => setDragCards(null) });
    }

    function handleDragCancel() {
        setActiveCard(null);
        setDragCards(null);
    }

    if (columnsLoading || cardsLoading) {
        return <p className="text-tertiary">Loading...</p>;
    }

    if (columnsError || cardsError) {
        return <ErrorMessage message="Could not load the board. You may not have access to this project, or it may not exist." />;
    }

    const activeCategory = activeCard?.categoryId ? categoriesById.get(activeCard.categoryId) : undefined;
    const activeAssignee = activeCard?.assigneeId ? membersById.get(activeCard.assigneeId) : undefined;

    // The column comes from the live list (not `activeCard`, frozen at drag start), so the clone
    // changes color when crossing into another column and previews its appearance at the destination.
    const activeColumnId = activeCard ? board.find((card) => card.id === activeCard.id)?.columnId : undefined;
    const activeColumnColor = columns?.find((column) => column.id === activeColumnId)?.color;

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                measuring={measuring}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="flex h-full items-start gap-4 overflow-x-auto">
                    {columns?.map((column) => (
                        <Column
                            key={column.id}
                            column={column}
                            cards={board.filter((card) => card.columnId === column.id)}
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
                            style={{ width: activeCardWidth, ...columnTint(activeColumnColor) }}
                            className="flex cursor-grabbing flex-col gap-2 rounded-lg border border-secondary bg-primary p-3 shadow-lg ring-2 ring-brand"
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
