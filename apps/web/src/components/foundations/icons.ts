import type { LucideIcon } from "lucide-react";
import {
    ArrowLeft,
    BookOpen,
    ChevronDown,
    Columns3,
    ExternalLink,
    FileText,
    LayoutGrid,
    List,
    LogOut,
    Menu,
    Search,
    Settings,
    X,
} from "lucide-react";

/**
 * Semantic application icons. Feature code should use this registry for shared UI actions so
 * changing the concrete icon remains a deliberate system-wide decision.
 */
export const AppIcons: Record<string, LucideIcon> & {
    ChevronDown: LucideIcon;
    Close: LucideIcon;
    Back: LucideIcon;
    Board: LucideIcon;
    Documents: LucideIcon;
    ExternalLink: LucideIcon;
    Issues: LucideIcon;
    Menu: LucideIcon;
    Overview: LucideIcon;
    Projects: LucideIcon;
    Search: LucideIcon;
    Settings: LucideIcon;
    SignOut: LucideIcon;
} = {
    ChevronDown,
    Close: X,
    Back: ArrowLeft,
    Board: Columns3,
    Documents: BookOpen,
    ExternalLink,
    Issues: List,
    Menu,
    Overview: FileText,
    Projects: LayoutGrid,
    Search,
    Settings,
    SignOut: LogOut,
};
