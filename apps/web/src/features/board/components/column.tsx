import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import type { Issue, IssuePerson } from "@/features/issues/api";
import { ApiError } from "@/lib/api-client";
import { cx } from "@/utils/cx";
import type { BoardColumn } from "../api";
import { useDeleteColumn, useUpdateColumn } from "../hooks/use-board";
import { StateIcon } from "./issue-property-icons";
import { ArrowCollapseOutline, ArrowExpandOutline } from "@makeplane/propel/icons";
import { IssueCard } from "./issue-card";

interface ColumnProps {
    column: BoardColumn;
    issues: Issue[];
    projectId: string;
    categoriesById: Map<string, { name: string; color: string | null }>;
    membersById: Map<string, IssuePerson>;
    cyclesById: Map<string, { name: string }>;
    onOpenIssue: (identifier: string) => void;
    onCreateIssue: (columnId: string) => void;
}

export const Column = ({ column, issues, projectId, categoriesById, membersById, cyclesById, onOpenIssue, onCreateIssue }: ColumnProps) => {
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id });

    const updateColumn = useUpdateColumn(projectId);
    const deleteColumn = useDeleteColumn(projectId);

    const [collapsed, setCollapsed] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(column.name);
    const [error, setError] = useState<string | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingName) {
            nameInputRef.current?.select();
        }
    }, [isEditingName]);

    function startEditing() {
        setName(column.name);
        setIsEditingName(true);
    }

    function saveName() {
        setIsEditingName(false);
        const trimmed = name.trim();
        if (!trimmed || trimmed === column.name) {
            setName(column.name);
            return;
        }
        updateColumn.mutate({ columnId: column.id, input: { name: trimmed } }, {
            onError: (err) => setError(err instanceof ApiError ? err.message : "Could not rename the column"),
        });
    }

    function handleDelete() {
        setError(null);
        deleteColumn.mutate(column.id, {
            onError: (err) => setError(err instanceof ApiError ? err.message : "Could not delete the column"),
        });
    }

    return (
        <div data-board-column={column.id} className={cx("group/column flex h-full max-h-full shrink-0 flex-col", collapsed ? "w-11" : "w-[350px]")}>
            <div className="mb-3 flex h-[25px] shrink-0 items-center gap-2">
                {isEditingName ? (
                    <Input
                        size="sm"
                        aria-label="Column name"
                        value={name}
                        onChange={setName}
                        onBlur={saveName}
                        autoFocus
                        ref={nameInputRef}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") saveName();
                            if (event.key === "Escape") {
                                setName(column.name);
                                setIsEditingName(false);
                            }
                        }}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={startEditing}
                        className="flex min-w-0 items-center gap-2 rounded px-0.5 text-left text-h6-medium text-primary hover:bg-layer-1-hover"
                    >
                        <StateIcon name={column.name} color={column.color} />
                        {!collapsed && <span className="truncate">{column.name}</span>}
                    </button>
                )}

                {!collapsed && <span className="text-body-sm-regular text-tertiary">{issues.length}</span>}
                <div className="ml-auto flex shrink-0 items-center gap-1">
                    <ButtonUtility icon={collapsed ? ArrowExpandOutline : ArrowCollapseOutline} size="xs" color="tertiary" tooltip={collapsed ? `Expand ${column.name}` : `Collapse ${column.name}`} onClick={() => setCollapsed(!collapsed)} />
                    {!collapsed && <ButtonUtility icon={Plus} size="xs" color="tertiary" tooltip={`Add issue to ${column.name}`} onClick={() => onCreateIssue(column.id)} />}
                    <div className="hidden group-hover/column:block group-focus-within/column:block">
                    <ConfirmDialog
                        trigger={<ButtonUtility icon={Trash2} size="xs" color="tertiary" tooltip="Delete column" />}
                        title="Delete column"
                        description={`The column "${column.name}" will be deleted. This action cannot be undone.`}
                        confirmLabel="Delete column"
                        isPending={deleteColumn.isPending}
                        onConfirm={handleDelete}
                    />
                    </div>
                </div>
            </div>

            {error && <p className="px-3 pb-2 text-xs text-danger-primary">{error}</p>}

            <div ref={setDropRef} className={cx("min-h-0 flex-1 overflow-y-auto rounded-sm", collapsed && "hidden", isOver && "bg-accent-subtle/50")}>
                <SortableContext items={issues.map((issue) => issue.id)} strategy={verticalListSortingStrategy}>
                    {issues.map((issue) => (
                        <IssueCard
                            key={issue.id}
                            issue={issue}
                            projectId={projectId}
                            column={column}
                            cycle={issue.cycleId ? cyclesById.get(issue.cycleId) : undefined}
                            category={issue.categoryId ? categoriesById.get(issue.categoryId) : undefined}
                            assignee={issue.assigneeId ? membersById.get(issue.assigneeId) : undefined}
                            onClick={() => onOpenIssue(issue.identifier)}
                        />
                    ))}
                </SortableContext>
                <Button color="tertiary" size="sm" iconLeading={Plus} onClick={() => onCreateIssue(column.id)} className="w-full justify-start px-2 text-primary">
                    New issue
                </Button>
            </div>
        </div>
    );
};
