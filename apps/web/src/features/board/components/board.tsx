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
import { useMemo, useState } from "react";
import { ErrorMessage } from "@/components/feedback/error-message";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import type { BoardCard } from "../api";
import { useCards, useColumns, useUpdateCard } from "../hooks/use-board";
import { positionAtIndex } from "../position";
import { AddColumnForm } from "./add-column-form";
import { CardItemContent } from "./card-item";
import { columnTint } from "./column-color";
import { CardModal, type CardModalTarget } from "./card-modal";
import { Column } from "./column";

/**
 * Num board, o que importa é o que está literalmente sob o cursor (`pointerWithin`) — bem mais
 * previsível que distância entre centros, que num card pequeno dentro de uma coluna alta escolhe
 * o alvo errado. `rectIntersection` cobre o caso do cursor cair num vão entre colunas.
 */
const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

/** As colunas mudam de tamanho enquanto os cards entram e saem durante o arrasto, então os retângulos precisam ser remedidos continuamente. */
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
     * Lista achatada de todos os cards, já em ordem visual (as colunas só filtram, não ordenam).
     * Durante o arrasto `dragCards` assume: ele é reordenado em `onDragOver` para que as colunas
     * reflitam ao vivo onde o card vai cair, em vez do usuário arrastar às cegas.
     */
    const board = useMemo(() => dragCards ?? [...(cards ?? [])].sort((a, b) => a.position - b.position), [dragCards, cards]);

    /** Resolve a coluna alvo: o `over` é a própria coluna (área de cards) ou um card dentro dela. */
    function resolveColumnId(overId: string, list: BoardCard[]): string | undefined {
        if (columns?.some((column) => column.id === overId)) return overId;
        return list.find((card) => card.id === overId)?.columnId;
    }

    function handleDragStart(event: DragStartEvent) {
        const activeId = String(event.active.id);
        setActiveCard(board.find((card) => card.id === activeId) ?? null);
        setDragCards(board);

        // `active.rect.current.initial` às vezes ainda não foi medido neste frame; ler a largura
        // direto do elemento (que ainda está no DOM aqui) é mais confiável pro clone do overlay.
        const node = document.querySelector<HTMLElement>(`[data-card-id="${activeId}"]`);
        setActiveCardWidth(node?.getBoundingClientRect().width ?? event.active.rect.current.initial?.width);
    }

    /**
     * Só trata TROCA DE COLUNA: move o card pra lista da coluna sobrevoada enquanto o arrasto
     * acontece, o que faz a coluna de origem fechar o buraco e a de destino abrir espaço ao vivo.
     * Reordenação dentro da mesma coluna fica por conta do `SortableContext` (transform visual),
     * e é resolvida de fato no drop — mexer no estado aqui também causaria movimento em dobro.
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

            return [
                ...withoutDragged.slice(0, insertAt),
                { ...dragged, columnId: targetColumnId },
                ...withoutDragged.slice(insertAt),
            ];
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

        // `arrayMove` é a mesma operação que o SortableContext usa pra calcular a prévia visual,
        // então o resultado do drop bate exatamente com o buraco que o usuário estava vendo.
        const columnCards = list.filter((card) => card.columnId === targetColumnId);
        const fromIndex = columnCards.findIndex((card) => card.id === activeId);

        // Só quando o alvo é outro card existe um índice específico; soltar sobre a coluna significa "no fim".
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

        // Mantém a prévia do arrasto (`dragCards`) até a mutação assentar, em vez de zerar aqui:
        // o `onMutate` do `useUpdateCard` escreve no cache de forma assíncrona, então limpar antes
        // deixaria o board cair pro `cards` antigo por um frame — o card "volta" e só depois "vai"
        // pro lugar certo. Congelando a prévia, o board já nasce otimista e só reverte em erro.
        updateCard.mutate(
            { cardId: activeId, input: { columnId: targetColumnId, position } },
            { onSettled: () => setDragCards(null) },
        );
    }

    function handleDragCancel() {
        setActiveCard(null);
        setDragCards(null);
    }

    if (columnsLoading || cardsLoading) {
        return <p className="text-tertiary">Carregando...</p>;
    }

    if (columnsError || cardsError) {
        return <ErrorMessage message="Não foi possível carregar o board. Você pode não ter acesso a este projeto, ou ele pode não existir." />;
    }

    const activeCategory = activeCard?.categoryId ? categoriesById.get(activeCard.categoryId) : undefined;
    const activeAssignee = activeCard?.assigneeId ? membersById.get(activeCard.assigneeId) : undefined;

    // A coluna vem da lista viva (não do `activeCard`, congelado no início do arrasto), então o
    // clone troca de cor ao cruzar pra outra coluna, prevendo como o card vai ficar no destino.
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
