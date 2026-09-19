import { arrayMove } from "@dnd-kit/sortable";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Alert } from "@/components/base/feedback/alert";
import { Input } from "@/components/base/input/input";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import { ApiError } from "@/lib/api-client";
import { useCreateColumn, useDeleteColumn, useColumns, useUpdateColumn } from "../hooks/use-board";
import { positionAtIndex } from "../position";
import { COLUMN_COLORS } from "./column-color";
import { ColumnColorPicker } from "./column-color-picker";

interface ColumnsPanelProps {
    projectId: string;
    isProjectOwner: boolean;
}

/** All status management lives here so Settings and the Board expose the same model. */
export const ColumnsPanel = ({ projectId, isProjectOwner }: ColumnsPanelProps) => {
    const { data: columns, isLoading, isError } = useColumns(projectId);
    const createColumn = useCreateColumn(projectId);
    const updateColumn = useUpdateColumn(projectId);
    const deleteColumn = useDeleteColumn(projectId);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState(COLUMN_COLORS[0]);
    const [error, setError] = useState<string | null>(null);

    if (isLoading) return <LoadingState label="Loading statuses..." />;
    if (isError) return <ErrorMessage message="Could not load the project statuses." />;

    function showError(reason: unknown, fallback: string) {
        setError(reason instanceof ApiError ? reason.message : fallback);
    }

    function createStatus(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = newName.trim();
        if (!name) {
            setError("Add a status name.");
            return;
        }
        setError(null);
        createColumn.mutate(
            { name, color: newColor },
            {
                onSuccess: () => {
                    setNewName("");
                    setNewColor(COLUMN_COLORS[0]);
                },
                onError: (reason) => showError(reason, "Could not create the status."),
            },
        );
    }

    function moveColumn(columnId: string, direction: -1 | 1) {
        if (!columns) return;
        const fromIndex = columns.findIndex((column) => column.id === columnId);
        const toIndex = fromIndex + direction;
        if (fromIndex === -1 || toIndex < 0 || toIndex >= columns.length) return;

        const ordered = arrayMove(columns, fromIndex, toIndex);
        const finalIndex = ordered.findIndex((column) => column.id === columnId);
        const position = positionAtIndex(ordered.filter((column) => column.id !== columnId), finalIndex);
        updateColumn.mutate({ columnId, input: { position } }, { onError: (reason) => showError(reason, "Could not reorder the status.") });
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-tertiary">Manage the statuses used by this project. Their order matches the board from left to right.</p>

            {isProjectOwner && (
                <form className="flex flex-col gap-3 rounded-lg border border-subtle p-4" onSubmit={createStatus}>
                    <div>
                        <h3 className="text-sm font-semibold text-primary">New status</h3>
                        <p className="mt-1 text-sm text-tertiary">Add a status without leaving Settings.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <Input label="Name" value={newName} onChange={(value) => { setError(null); setNewName(value); }} placeholder="Status name" className="min-w-0 flex-1" />
                        <ColumnColorPicker label="Color" value={newColor} onChange={setNewColor} />
                        <Button type="submit" iconLeading={Plus} isLoading={createColumn.isPending}>Add</Button>
                    </div>
                </form>
            )}

            {error && <Alert tone="error">{error}</Alert>}
            {!columns || columns.length === 0 ? (
                <EmptyState title="No statuses yet" description={isProjectOwner ? "Create a status above to start organizing issues." : "This project does not have any statuses yet."} />
            ) : (
                <ul className="flex flex-col gap-3">
                    {columns.map((column, index) => (
                        <StatusRow
                            key={column.id}
                            column={column}
                            index={index}
                            count={columns.length}
                            isProjectOwner={isProjectOwner}
                            isPending={updateColumn.isPending || deleteColumn.isPending}
                            onMove={(direction) => moveColumn(column.id, direction)}
                            onRename={(name) => updateColumn.mutate({ columnId: column.id, input: { name } }, { onError: (reason) => showError(reason, "Could not rename the status.") })}
                            onColorChange={(color) => updateColumn.mutate({ columnId: column.id, input: { color } }, { onError: (reason) => showError(reason, "Could not update the status color.") })}
                            onDelete={() => deleteColumn.mutate(column.id, { onError: (reason) => showError(reason, "Could not delete the status.") })}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
};

function StatusRow({ column, index, count, isProjectOwner, isPending, onMove, onRename, onColorChange, onDelete }: {
    column: { id: string; name: string; color: string | null };
    index: number;
    count: number;
    isProjectOwner: boolean;
    isPending: boolean;
    onMove: (direction: -1 | 1) => void;
    onRename: (name: string) => void;
    onColorChange: (color: string | null) => void;
    onDelete: () => void;
}) {
    const [name, setName] = useState(column.name);

    function submitRename(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextName = name.trim();
        if (!nextName || nextName === column.name) {
            setName(column.name);
            return;
        }
        onRename(nextName);
    }

    return (
        <li className="flex flex-col gap-3 rounded-xl border border-subtle p-4">
            <div className="flex items-center justify-between gap-3">
                {isProjectOwner ? (
                    <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={submitRename}>
                        <span className="shrink-0 text-sm text-tertiary">{index + 1}.</span>
                        <Input size="sm" value={name} isDisabled={isPending} onChange={setName} aria-label={`Status ${column.name}`} className="min-w-0 flex-1" wrapperClassName="bg-transparent shadow-none ring-transparent focus-within:ring-accent-strong" inputClassName="font-medium" />
                        <Button type="submit" size="xs" color="tertiary" isDisabled={isPending || name.trim() === column.name}>Save</Button>
                    </form>
                ) : (
                    <p className="min-w-0 truncate text-sm font-medium text-primary"><span className="text-tertiary">{index + 1}.</span> {column.name}</p>
                )}

                {isProjectOwner && (
                    <div className="flex shrink-0 items-center gap-1">
                        <ButtonUtility icon={ArrowLeft} size="sm" color="tertiary" tooltip="Move left" isDisabled={isPending || index === 0} onClick={() => onMove(-1)} />
                        <ButtonUtility icon={ArrowRight} size="sm" color="tertiary" tooltip="Move right" isDisabled={isPending || index === count - 1} onClick={() => onMove(1)} />
                        <ConfirmDialog trigger={<ButtonUtility icon={Trash2} size="sm" color="tertiary" tooltip="Delete status" isDisabled={isPending} />} title="Delete status" description={`The status "${column.name}" will be deleted. Move its issues first; statuses with issues cannot be deleted.`} confirmLabel="Delete status" isPending={isPending} onConfirm={onDelete} />
                    </div>
                )}
            </div>

            {isProjectOwner ? <ColumnColorPicker label="Color" value={column.color} onChange={onColorChange} /> : <p className="flex items-center gap-2 text-sm text-tertiary"><span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: column.color ?? "#87888c" }} />{column.color ?? "No color"}</p>}
        </li>
    );
}
