import { Badge } from "@/components/base/badges/badges";

const LABELS = { low: "Baixa", medium: "Média", high: "Alta" } as const;
const COLORS = { low: "success", medium: "warning", high: "error" } as const;

export const DIFFICULTY_ITEMS = [
    { id: "low", label: LABELS.low },
    { id: "medium", label: LABELS.medium },
    { id: "high", label: LABELS.high },
];

export const DifficultyBadge = ({ difficulty }: { difficulty: "low" | "medium" | "high" }) => (
    <Badge color={COLORS[difficulty]} size="sm" type="pill-color">
        {LABELS[difficulty]}
    </Badge>
);
