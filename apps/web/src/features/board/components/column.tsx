import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CircleDashed, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import type { Issue, IssuePerson } from "@/features/issues/api";
import { ApiError } from "@/lib/api-client";
import { cx } from "@/utils/cx";
import type { BoardColumn } from "../api";
import { useDeleteColumn, useUpdateColumn } from "../hooks/use-board";
import { COLUMN_FALLBACK_COLOR } from "./column-color";
import { IssueCard } from "./issue-card";

interface ColumnProps {
    column: BoardColumn;
    issues: Issue[];
    projectId: string;
    categoriesById: Map<string, { name: string; color: string | null }>;
    membersById: Map<string, IssuePerson>;
    onOpenIssue: (identifier: string) => void;
    onCreateIssue: (columnId: string) => void;
}

export const Column = ({ column, issues, projectId, categoriesById, membersById, onOpenIssue, onCreateIssue }: ColumnProps) => {
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id });

    const updateColumn = useUpdateColumn(projectId);
    const deleteColumn = useDeleteColumn(projectId);

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
        updateColumn.mutate({ columnId: column.id, input: { name: trimmed } });
    }

    function handleDelete() {
        setError(null);
        deleteColumn.mutate(column.id, {
            onError: (err) => setError(err instanceof ApiError ? err.message : "Could not delete the column"),
        });
    }

    return (
        <div className="flex h-full max-h-full w-80 shrink-0 flex-col rounded-lg bg-secondary">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
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
                        className="flex min-w-0 items-center gap-2 rounded px-1 text-left text-sm font-semibold text-secondary hover:bg-primary_hover"
                    >
                        <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: column.color ?? COLUMN_FALLBACK_COLOR }} />
                        <span className="truncate">{column.name}</span>
                    </button>
                )}

                <div className="flex shrink-0 items-center gap-1">
                    <span className="text-xs text-tertiary">{issues.length}</span>
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

            {error && <p className="px-3 pb-2 text-xs text-error-primary">{error}</p>}

            <div ref={setDropRef} className={cx("min-h-20 min-h-0 flex-1 overflow-y-auto rounded-lg p-2", isOver && "bg-brand-primary_alt/60")}>
                <SortableContext items={issues.map((issue) => issue.id)} strategy={verticalListSortingStrategy}>
                    {issues.map((issue) => (
                        <IssueCard
                            key={issue.id}
                            issue={issue}
                            category={issue.categoryId ? categoriesById.get(issue.categoryId) : undefined}
                            assignee={issue.assigneeId ? membersById.get(issue.assigneeId) : undefined}
                            onClick={() => onOpenIssue(issue.identifier)}
                        />
                    ))}
                    {issues.length === 0 && (
                        <div className="flex min-h-24 flex-col items-center justify-center gap-1 px-3 text-center">
                            <CircleDashed className="size-4 text-fg-quaternary" aria-hidden="true" />
                            <p className="text-xs text-tertiary">No issues here</p>
                        </div>
                    )}
                </SortableContext>
            </div>

            <div className="p-2">
                <Button color="tertiary" size="sm" iconLeading={Plus} onClick={() => onCreateIssue(column.id)} className="w-full justify-start">
                    Add issue
                </Button>
            </div>
        </div>
    );
};
