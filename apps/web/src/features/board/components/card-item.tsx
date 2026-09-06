import { useDraggable } from "@dnd-kit/core";
import { Avatar } from "@/components/base/avatar/avatar";
import { CategoryBadge } from "@/features/categories/components/category-badge";
import { cx } from "@/utils/cx";
import type { BoardCard, CardPerson } from "../api";
import { DifficultyBadge } from "./difficulty-badge";

function initialsOf(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join("");
}

interface CardItemProps {
    card: BoardCard;
    category?: { name: string; color: string | null };
    assignee?: CardPerson;
    onClick: () => void;
}

export const CardItem = ({ card, category, assignee, onClick }: CardItemProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });

    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cx(
                "flex cursor-pointer touch-none flex-col gap-2 rounded-lg bg-primary p-3 shadow-xs ring-1 ring-secondary transition duration-100 ease-linear hover:ring-brand",
                isDragging && "z-10 opacity-50",
            )}
        >
            <p className="text-sm font-medium text-primary">{card.title}</p>

            {(category || card.difficulty) && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {category && <CategoryBadge category={category} />}
                    <DifficultyBadge difficulty={card.difficulty} />
                </div>
            )}

            {assignee && (
                <div className="flex items-center gap-1.5">
                    <Avatar initials={initialsOf(assignee.name)} size="xs" />
                    <span className="text-xs text-tertiary">{assignee.name}</span>
                </div>
            )}
        </div>
    );
};
