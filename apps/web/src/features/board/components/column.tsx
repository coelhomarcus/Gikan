import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash01 } from "@untitledui/icons";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { ApiError } from "@/lib/api-client";
import { cx } from "@/utils/cx";
import type { BoardCard, BoardColumn, CardPerson } from "../api";
import { useDeleteColumn, useUpdateColumn } from "../hooks/use-board";
import { CardItem } from "./card-item";

interface ColumnProps {
    column: BoardColumn;
    cards: BoardCard[];
    projectId: string;
    categoriesById: Map<string, { name: string; color: string | null }>;
    membersById: Map<string, CardPerson>;
    onOpenCard: (cardId: string) => void;
    onCreateCard: (columnId: string) => void;
}

export const Column = ({ column, cards, projectId, categoriesById, membersById, onOpenCard, onCreateCard }: ColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });
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
            onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível excluir a coluna"),
        });
    }

    return (
        <div className="flex w-80 shrink-0 flex-col rounded-xl bg-secondary">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                {isEditingName ? (
                    <Input
                        size="sm"
                        aria-label="Nome da coluna"
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
                        className="truncate rounded px-1 text-left text-sm font-semibold text-secondary hover:bg-primary_hover"
                    >
                        {column.name}
                    </button>
                )}

                <div className="flex shrink-0 items-center gap-1">
                    <span className="text-xs text-tertiary">{cards.length}</span>
                    <ButtonUtility icon={Trash01} size="xs" color="tertiary" tooltip="Excluir coluna" onClick={handleDelete} />
                </div>
            </div>

            {error && <p className="px-3 pb-2 text-xs text-error-primary">{error}</p>}

            <div ref={setNodeRef} className={cx("flex min-h-20 flex-1 flex-col gap-2 rounded-lg p-2", isOver && "bg-brand-primary_alt/60")}>
                <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <CardItem
                            key={card.id}
                            card={card}
                            category={card.categoryId ? categoriesById.get(card.categoryId) : undefined}
                            assignee={card.assigneeId ? membersById.get(card.assigneeId) : undefined}
                            onClick={() => onOpenCard(card.id)}
                        />
                    ))}
                </SortableContext>
            </div>

            <div className="p-2">
                <Button color="tertiary" size="sm" iconLeading={Plus} onClick={() => onCreateCard(column.id)} className="w-full justify-start">
                    Adicionar card
                </Button>
            </div>
        </div>
    );
};
