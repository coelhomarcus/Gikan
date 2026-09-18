import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "@/components/base/avatar/avatar";
import { CategoryBadge } from "@/features/categories/components/category-badge";
import type { Issue } from "@/features/issues/api";
import { cx } from "@/utils/cx";
import type { CardPerson } from "../api";
import { ImportanceBadge } from "./importance-badge";

function initialsOf(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join("");
}

interface CardContentProps {
    card: Issue;
    category?: { name: string; color: string | null };
    assignee?: CardPerson;
}

/** Pure visual card content without drag hooks — reused by `CardItem` (in the column) and `DragOverlay` (the floating drag clone; see `board.tsx`). */
export const CardItemContent = ({ card, category, assignee }: CardContentProps) => (
    <>
        <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-fg-brand-primary">{card.identifier}</span>
            {card.estimate && <span className="text-[11px] text-tertiary">{card.estimate} pts</span>}
        </div>
        <p className="text-sm font-medium text-primary">{card.title}</p>

        {(category || card.priority) && (
            <div className="flex flex-wrap items-center gap-1.5">
                {category && <CategoryBadge category={category} />}
                <ImportanceBadge importance={card.priority} />
            </div>
        )}

        {assignee && (
            <div className="flex items-center gap-1.5">
                <Avatar src={assignee.avatarUrl ?? undefined} initials={initialsOf(assignee.name)} size="xs" />
                <span className="text-xs text-tertiary">{assignee.name}</span>
            </div>
        )}
    </>
);

interface CardItemProps extends CardContentProps {
    onClick: () => void;
}

export const CardItem = ({ card, category, assignee, onClick }: CardItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            data-card-id={card.id}
            data-card-title={card.title}
            data-card-description=""
            className={cx(
                // Use `border` instead of `ring` because ring is a box-shadow and cannot receive an
                // inline style color, which is how the column tint reaches this component.
                "flex cursor-pointer touch-none flex-col gap-2 rounded-md border border-secondary bg-primary p-3 transition duration-100 ease-linear hover:border-brand hover:bg-primary_hover",
                isDragging && "z-10 opacity-50",
            )}
        >
            <CardItemContent card={card} category={category} assignee={assignee} />
        </div>
    );
};
