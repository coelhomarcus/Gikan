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
import { useLocation, useNavigate } from "react-router";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { useCategories } from "@/features/categories/hooks/use-categories";
import type { Issue } from "@/features/issues/api";
import { useIssues, useUpdateIssue } from "@/features/issues/hooks/use-issues";
import { IssueQuickCreateModal } from "@/features/issues/components/issue-quick-create-modal";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { ApiError } from "@/lib/api-client";
import { useColumns } from "../hooks/use-board";
import { positionAtIndex } from "../position";
import { AddColumnForm } from "./add-column-form";
import { Column } from "./column";
import { IssueCardContent } from "./issue-card";

/**
 * On a board, what matters is literally beneath the cursor (`pointerWithin`) — much more
 * predictable than center distance, which can choose the wrong target for a small card inside a
 * tall column. `rectIntersection` covers the case where the cursor falls in a gap between columns.
 */
const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

/** Columns change size as issues enter and leave during a drag, so their rectangles must be measured continuously. */
const measuring = { droppable: { strategy: MeasuringStrategy.Always } };

export const Board = ({ projectId }: { projectId: string }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: columns, isLoading: columnsLoading, isError: columnsError } = useColumns(projectId);
    const { data: issues, isLoading: issuesLoading, isError: issuesError } = useIssues(projectId, { orderBy: "position" });
    const { data: categories } = useCategories(projectId);
    const { data: members } = useProjectMembers(projectId);
    const updateIssue = useUpdateIssue(projectId);

    const [createColumnId, setCreateColumnId] = useState<string | null>(null);
    const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
    const [activeIssueWidth, setActiveIssueWidth] = useState<number>();
    const [dragIssues, setDragIssues] = useState<Issue[] | null>(null);
    const [moveError, setMoveError] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    const categoriesById = useMemo(() => new Map((categories ?? []).map((category) => [category.id, category])), [categories]);
    const membersById = useMemo(() => new Map((members ?? []).map((member) => [member.id, member])), [members]);

    /**
     * Flat list of all issues, already in visual order (columns only filter; they do not sort).
     * During a drag, `dragIssues` is reordered in `onDragOver` so columns live-preview where the
     * issue will land instead of making the user drag blindly.
     */
    const board = useMemo(() => dragIssues ?? [...(issues ?? [])].sort((a, b) => a.position - b.position), [dragIssues, issues]);

    /** Resolves the target column: `over` is the column itself (card area) or a card inside it. */
    function resolveColumnId(overId: string, list: Issue[]): string | undefined {
        if (columns?.some((column) => column.id === overId)) return overId;
        return list.find((issue) => issue.id === overId)?.columnId;
    }

    function handleDragStart(event: DragStartEvent) {
        setMoveError(null);
        const activeId = String(event.active.id);
        setActiveIssue(board.find((issue) => issue.id === activeId) ?? null);
        setDragIssues(board);

        // `active.rect.current.initial` is sometimes not measured in this frame yet; reading the
        // width directly from the element (still in the DOM here) is more reliable for the overlay clone.
        const node = document.querySelector<HTMLElement>(`[data-issue-id="${activeId}"]`);
        setActiveIssueWidth(node?.getBoundingClientRect().width ?? event.active.rect.current.initial?.width);
    }

    /**
     * Handles only COLUMN CHANGES: moves the issue to the hovered column's list while dragging,
     * making the source column close the gap and the destination open space live. Reordering
     * within the same column is handled by `SortableContext` (visual transform) and is finalized
     * on drop — changing state here would cause a double movement.
     */
    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        setDragIssues((current) => {
            const list = current ?? board;
            const dragged = list.find((issue) => issue.id === activeId);
            const targetColumnId = resolveColumnId(overId, list);

            if (!dragged || !targetColumnId || dragged.columnId === targetColumnId) return current;

            const withoutDragged = list.filter((issue) => issue.id !== activeId);
            const overIndex = withoutDragged.findIndex((issue) => issue.id === overId);
            const insertAt = overIndex === -1 ? withoutDragged.length : overIndex;

            return [...withoutDragged.slice(0, insertAt), { ...dragged, columnId: targetColumnId }, ...withoutDragged.slice(insertAt)];
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        const list = dragIssues ?? board;

        setActiveIssue(null);

        if (!over) {
            setDragIssues(null);
            return;
        }

        const activeId = String(active.id);
        const overId = String(over.id);

        const targetColumnId = resolveColumnId(overId, list);
        if (!targetColumnId) {
            setDragIssues(null);
            return;
        }

        // `arrayMove` is the same operation SortableContext uses for the visual preview, so the
        // drop result matches exactly the gap the user was seeing.
        const columnIssues = list.filter((issue) => issue.columnId === targetColumnId);
        const fromIndex = columnIssues.findIndex((issue) => issue.id === activeId);

        // Only another issue provides a specific index; dropping on the column means "at the end".
        const overIssueIndex = columnIssues.findIndex((issue) => issue.id === overId);
        const toIndex = overIssueIndex === -1 ? columnIssues.length - 1 : overIssueIndex;
        if (fromIndex === -1 || toIndex === -1) {
            setDragIssues(null);
            return;
        }

        const ordered = arrayMove(columnIssues, fromIndex, toIndex);
        const finalIndex = ordered.findIndex((issue) => issue.id === activeId);
        const position = positionAtIndex(
            ordered.filter((issue) => issue.id !== activeId),
            finalIndex,
        );

        const original = issues?.find((issue) => issue.id === activeId);
        if (original && original.columnId === targetColumnId && original.position === position) {
            setDragIssues(null);
            return;
        }

        // Keep the drag preview (`dragIssues`) until the mutation settles instead of clearing it:
        // `useUpdateIssue` updates the canonical issue cache optimistically, so clearing it first
        // would make the board fall back to old issues for one frame — the issue would "return"
        // and only then move to the right place. Freezing the preview makes the board optimistic
        // immediately and only reverts on error.
        const activeIssue = list.find((issue) => issue.id === activeId);
        if (!activeIssue) {
            setDragIssues(null);
            return;
        }

        updateIssue.mutate(
            { identifier: activeIssue.identifier, input: { columnId: targetColumnId, position } },
            {
                onError: (reason) => setMoveError(reason instanceof ApiError ? reason.message : "Could not move the issue."),
                onSettled: () => setDragIssues(null),
            },
        );
    }

    function handleDragCancel() {
        setActiveIssue(null);
        setDragIssues(null);
    }

    if (columnsLoading || issuesLoading) {
        return <LoadingState label="Loading board..." className="p-4" />;
    }

    if (columnsError || issuesError) {
        return <ErrorMessage message="Could not load the board. You may not have access to this project, or it may not exist." />;
    }

    const activeCategory = activeIssue?.categoryId ? categoriesById.get(activeIssue.categoryId) : undefined;
    const activeAssignee = activeIssue?.assigneeId ? membersById.get(activeIssue.assigneeId) : undefined;

    return (
        <>
            {moveError && <p role="alert" className="mb-3 rounded-md border border-error-subtle bg-error-primary px-3 py-2 text-sm text-error-primary">{moveError}</p>}
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
                            issues={board.filter((issue) => issue.columnId === column.id)}
                            projectId={projectId}
                            categoriesById={categoriesById}
                            membersById={membersById}
                            onOpenIssue={(identifier) => navigate(`/projects/${projectId}/issues/${identifier}`, { state: { backgroundLocation: location } })}
                            onCreateIssue={(columnId) => setCreateColumnId(columnId)}
                        />
                    ))}
                    <AddColumnForm projectId={projectId} />
                </div>

                <DragOverlay>
                    {activeIssue && (
                        <div
                            style={{ width: activeIssueWidth }}
                            className="flex cursor-grabbing flex-col gap-2 rounded-md border border-brand bg-primary p-3 shadow-lg"
                        >
                            <IssueCardContent issue={activeIssue} category={activeCategory} assignee={activeAssignee} />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {createColumnId && <IssueQuickCreateModal projectId={projectId} columnId={createColumnId} onClose={() => setCreateColumnId(null)} />}
        </>
    );
};
