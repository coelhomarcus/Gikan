import { useMemo, useState } from "react";
import { Home02 } from "@untitledui/icons";
import { useHotkeys } from "react-hotkeys-hook";
import { useLocation } from "react-router";
import type { NavItemType } from "@/components/application/app-navigation/config";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import { ProjectSearchModal } from "@/features/projects/components/project-search-modal";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { SidebarAccount } from "./sidebar-account";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
const SEARCH_SHORTCUT_LABEL = isMac ? "⌘K" : "Ctrl+K";

export const Sidebar = () => {
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { data: projects } = useProjects();

    const navItems = useMemo<NavItemType[]>(
        () => [
            {
                label: "Projetos",
                href: "/",
                icon: Home02,
                items: (projects ?? []).map((project) => ({ label: project.name, href: `/projects/${project.id}` })),
            },
        ],
        [projects],
    );

    useHotkeys(
        "mod+k",
        (event) => {
            event.preventDefault();
            setIsSearchOpen(true);
        },
        { enableOnFormTags: true },
    );

    return (
        <>
            <SidebarNavigationSimple
                activeUrl={location.pathname}
                items={navItems}
                showAccountCard={false}
                featureCard={<SidebarAccount />}
                onSearchClick={() => setIsSearchOpen(true)}
                searchShortcut={SEARCH_SHORTCUT_LABEL}
            />
            {isSearchOpen && <ProjectSearchModal onClose={() => setIsSearchOpen(false)} />}
        </>
    );
};
