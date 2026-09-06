import type { Category } from "../api";

export const CATEGORY_COLORS = ["#f04438", "#f79009", "#eaaa08", "#17b26a", "#15b79e", "#2e90fa", "#0070f3", "#7a5af8"];

export const CategoryBadge = ({ category }: { category: Pick<Category, "name" | "color"> }) => {
    const color = category.color ?? "#87888c";

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: color, color }}>
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            {category.name}
        </span>
    );
};
