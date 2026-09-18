import { arrayMove } from "@dnd-kit/sortable";
import { ArrowLeft, ArrowRight } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ErrorMessage } from "@/components/feedback/error-message";
import { useColumns, useUpdateColumn } from "../hooks/use-board";
import { positionAtIndex } from "../position";
import { ColumnColorPicker } from "./column-color-picker";

interface ColumnsPanelProps {
    projectId: string;
    isProjectOwner: boolean;
}

/**
 * Column order and color. Renaming and deletion remain on the board itself (by clicking the
 * column name / trash icon); this panel contains the two settings that had no home before.
 */
export const ColumnsPanel = ({ projectId, isProjectOwner }: ColumnsPanelProps) => {
    const { data: columns, isLoading, isError } = useColumns(projectId);
    const updateColumn = useUpdateColumn(projectId);

    if (isLoading) return <p className="text-tertiary">Loading...</p>;
    if (isError) return <ErrorMessage message="Could not load the project columns." />;
    if (!columns || columns.length === 0) return <p className="text-sm text-tertiary">This project has no columns yet.</p>;

    /** Moves a column one position and recalculates `position` between its new neighbors. */
    function moveColumn(columnId: string, direction: -1 | 1) {
        if (!columns) return;

        const fromIndex = columns.findIndex((column) => column.id === columnId);
        const toIndex = fromIndex + direction;
        if (fromIndex === -1 || toIndex < 0 || toIndex >= columns.length) return;

        const ordered = arrayMove(columns, fromIndex, toIndex);
        const finalIndex = ordered.findIndex((column) => column.id === columnId);
        const position = positionAtIndex(
            ordered.filter((column) => column.id !== columnId),
            finalIndex,
        );

        updateColumn.mutate({ columnId, input: { position } });
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-tertiary">The columns below are ordered from left to right on the board. Each column color tints its cards.</p>

            <ul className="flex flex-col gap-3">
                {columns.map((column, index) => (
                    <li key={column.id} className="flex flex-col gap-3 rounded-xl border border-secondary p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="min-w-0 truncate text-sm font-medium text-primary">
                                <span className="text-tertiary">{index + 1}.</span> {column.name}
                            </p>

                            {isProjectOwner && (
                                <div className="flex shrink-0 items-center gap-1">
                                    <ButtonUtility
                                        icon={ArrowLeft}
                                        size="sm"
                                        color="tertiary"
                                        tooltip="Move left"
                                        isDisabled={index === 0}
                                        onClick={() => moveColumn(column.id, -1)}
                                    />
                                    <ButtonUtility
                                        icon={ArrowRight}
                                        size="sm"
                                        color="tertiary"
                                        tooltip="Move right"
                                        isDisabled={index === columns.length - 1}
                                        onClick={() => moveColumn(column.id, 1)}
                                    />
                                </div>
                            )}
                        </div>

                        {isProjectOwner ? (
                            <ColumnColorPicker
                                label=""
                                value={column.color}
                                onChange={(color) => updateColumn.mutate({ columnId: column.id, input: { color } })}
                            />
                        ) : (
                            <p className="flex items-center gap-2 text-sm text-tertiary">
                                <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: column.color ?? "#87888c" }} />
                                {column.color ?? "No color"}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};
