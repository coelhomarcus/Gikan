import { Badge } from "@/components/base/badges/badges";

const LABELS = { low: "Baixa", medium: "Média", high: "Alta" } as const;
const COLORS = { low: "success", medium: "warning", high: "error" } as const;
const DOT_CLASSES = { low: "bg-fg-success-secondary", medium: "bg-fg-warning-secondary", high: "bg-fg-error-secondary" } as const;

export const IMPORTANCE_ITEMS = (Object.keys(LABELS) as (keyof typeof LABELS)[]).map((key) => ({
    id: key,
    label: LABELS[key],
    icon: <span className={`size-2 rounded-full ${DOT_CLASSES[key]}`} />,
}));

export const ImportanceBadge = ({ importance }: { importance: "low" | "medium" | "high" }) => (
    <Badge color={COLORS[importance]} size="sm" type="pill-color">
        {LABELS[importance]}
    </Badge>
);
