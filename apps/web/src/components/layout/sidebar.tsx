import { useState } from "react";
import { Home02 } from "@untitledui/icons";
import { useHotkeys } from "react-hotkeys-hook";
import { useLocation } from "react-router";
import { NavItemBase } from "@/components/application/app-navigation/base-components/nav-item";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import { ProjectIcon } from "@/features/projects/components/project-icon";
import { ProjectSearchModal } from "@/features/projects/components/project-search-modal";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { SidebarAccount } from "./sidebar-account";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
const SEARCH_SHORTCUT_LABEL = isMac ? "⌘K" : "Ctrl+K";

export const Sidebar = () => {
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { data: projects } = useProjects();

    const navSlot = (
        <ul className="flex flex-col px-4 pt-5">
            <li className="py-px">
                <NavItemBase type="link" href="/" icon={Home02} current={location.pathname === "/"}>
                    Projetos
                </NavItemBase>
            </li>
            {(projects ?? []).length > 0 && (
                <li className="py-0.25">
                    <ul className="pb-1">
                        {(projects ?? []).map((project) => (
                            <li key={project.id} className="py-0.25">
                                {/* `collapsible-child` não renderiza a prop `icon` (só `link` renderiza), então o ícone
                                    vai junto do texto e o truncate fica por conta do span interno. */}
                                <NavItemBase
                                    type="collapsible-child"
                                    href={`/projects/${project.id}`}
                                    current={location.pathname === `/projects/${project.id}` || location.pathname.startsWith(`/projects/${project.id}/`)}
                                    truncate={false}
                                >
                                    <span className="flex items-center gap-2">
                                        <ProjectIcon icon={project.icon} className="size-4 shrink-0 text-fg-quaternary" />
                                        <span className="truncate">{project.name}</span>
                                    </span>
                                </NavItemBase>
                            </li>
                        ))}
                    </ul>
                </li>
            )}
        </ul>
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
                items={[]}
                navSlot={navSlot}
                showAccountCard={false}
                featureCard={<SidebarAccount />}
                onSearchClick={() => setIsSearchOpen(true)}
                searchShortcut={SEARCH_SHORTCUT_LABEL}
            />
            {isSearchOpen && <ProjectSearchModal onClose={() => setIsSearchOpen(false)} />}
        </>
    );
};
