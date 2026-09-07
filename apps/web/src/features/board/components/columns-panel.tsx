import { ErrorMessage } from "@/components/feedback/error-message";
import { useColumns, useUpdateColumn } from "../hooks/use-board";
import { ColumnColorPicker } from "./column-color-picker";

interface ColumnsPanelProps {
    projectId: string;
    isProjectOwner: boolean;
}

/**
 * Edição das cores das colunas. Renomear e excluir continuam no próprio board (clicando no nome
 * da coluna / na lixeira), então aqui o painel cuida só da cor, que não tinha lugar nenhum antes.
 */
export const ColumnsPanel = ({ projectId, isProjectOwner }: ColumnsPanelProps) => {
    const { data: columns, isLoading, isError } = useColumns(projectId);
    const updateColumn = useUpdateColumn(projectId);

    if (isLoading) return <p className="text-tertiary">Carregando...</p>;
    if (isError) return <ErrorMessage message="Não foi possível carregar as colunas do projeto." />;
    if (!columns || columns.length === 0) return <p className="text-sm text-tertiary">Este projeto ainda não tem colunas.</p>;

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-tertiary">A cor da coluna tinge os cards que estão nela, dando leitura rápida do estágio de cada tarefa.</p>

            <ul className="flex flex-col gap-3">
                {columns.map((column) => (
                    <li key={column.id} className="flex flex-col gap-3 rounded-xl border border-secondary p-4">
                        <p className="text-sm font-medium text-primary">{column.name}</p>

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
