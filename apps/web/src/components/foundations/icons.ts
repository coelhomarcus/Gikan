import type { LucideIcon } from "lucide-react";
import { ChevronDown, ExternalLink, LayoutGrid, LogOut, Menu, Search, Settings, X } from "lucide-react";

/**
 * Semantic application icons. Feature code should use this registry for shared UI actions so
 * changing the concrete icon remains a deliberate system-wide decision.
 */
export const AppIcons: Record<string, LucideIcon> & {
    ChevronDown: LucideIcon;
    Close: LucideIcon;
    ExternalLink: LucideIcon;
    Menu: LucideIcon;
    Projects: LucideIcon;
    Search: LucideIcon;
    Settings: LucideIcon;
    SignOut: LucideIcon;
} = {
    ChevronDown,
    Close: X,
    ExternalLink,
    Menu,
    Projects: LayoutGrid,
    Search,
    Settings,
    SignOut: LogOut,
};
