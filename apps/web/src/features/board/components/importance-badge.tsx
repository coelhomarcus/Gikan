import { Badge } from "@/components/base/badges/badges";
import { useTranslation } from "react-i18next";

const COLORS = { low: "success", medium: "warning", high: "error" } as const;
const DOT_CLASSES = { low: "bg-fg-success-secondary", medium: "bg-fg-warning-secondary", high: "bg-fg-error-secondary" } as const;

export const ImportanceBadge = ({ importance }: { importance: "low" | "medium" | "high" }) => {
    const { t } = useTranslation();
    return <Badge color={COLORS[importance]} size="sm" type="pill-color">{t(`issue.${importance}`)}</Badge>;
};

export const IMPORTANCE_ITEMS = ["low", "medium", "high"].map((key) => ({
    id: key,
    label: key,
    icon: <span className={`size-2 rounded-full ${DOT_CLASSES[key as keyof typeof DOT_CLASSES]}`} />,
}));
