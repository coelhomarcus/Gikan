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
 * Ordem e cor das colunas. Renomear e excluir continuam no próprio board (clicando no nome da
 * coluna / na lixeira); aqui ficam as duas coisas que não tinham lugar nenhum antes.
 */
export const ColumnsPanel = ({ projectId, isProjectOwner }: ColumnsPanelProps) => {
    const { data: columns, isLoading, isError } = useColumns(projectId);
    const updateColumn = useUpdateColumn(projectId);

    if (isLoading) return <p className="text-tertiary">Carregando...</p>;
    if (isError) return <ErrorMessage message="Não foi possível carregar as colunas do projeto." />;
    if (!columns || columns.length === 0) return <p className="text-sm text-tertiary">Este projeto ainda não tem colunas.</p>;

    /** Move a coluna uma casa pro lado, recalculando a `position` entre os novos vizinhos. */
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
            <p className="text-sm text-tertiary">
                A ordem abaixo é a ordem das colunas no board, da esquerda pra direita. A cor da coluna tinge os cards que estão nela.
            </p>

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
                                        tooltip="Mover para a esquerda"
                                        isDisabled={index === 0}
                                        onClick={() => moveColumn(column.id, -1)}
                                    />
                                    <ButtonUtility
                                        icon={ArrowRight}
                                        size="sm"
                                        color="tertiary"
                                        tooltip="Mover para a direita"
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
                                {column.color ?? "Sem cor"}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};
