import { useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { NavItemBase } from "@/components/application/app-navigation/base-components/nav-item";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import { AppIcons } from "@/components/foundations/icons";
import { ProjectIcon } from "@/features/projects/components/project-icon";
import { ProjectSearchModal } from "@/features/projects/components/project-search-modal";
import { IssueQuickCreateModal } from "@/features/issues/components/issue-quick-create-modal";
import { useColumns } from "@/features/board/hooks/use-board";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { SidebarAccount } from "./sidebar-account";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
const SEARCH_SHORTCUT_LABEL = isMac ? "⌘K" : "Ctrl+K";

export const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isProjectsExpanded, setIsProjectsExpanded] = useState(() => typeof window === "undefined" || localStorage.getItem("gikan-projects-expanded") !== "false");
    const { data: projects } = useProjects();
    const activeProjectId = location.pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? "";
    const { data: activeColumns } = useColumns(activeProjectId);

    useEffect(() => {
        if (activeProjectId) setIsProjectsExpanded(true);
    }, [activeProjectId]);

    function toggleProjects() {
        setIsProjectsExpanded((expanded) => {
            const next = !expanded;
            localStorage.setItem("gikan-projects-expanded", String(next));
            return next;
        });
    }

    const navSlot = (
        <ul className="flex flex-col px-3 pt-4">
            <li className="py-px">
                <NavItemBase type="link" href="/" icon={AppIcons.Projects} current={location.pathname === "/"}>
                    Projects
                </NavItemBase>
            </li>
            {(projects ?? []).length > 0 && (
                <li className="py-0.25">
                    <button type="button" aria-expanded={isProjectsExpanded} onClick={toggleProjects} className="flex w-full items-center justify-between rounded px-3 pb-1 pt-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-tertiary hover:text-secondary">
                        Your projects
                        <ChevronDown aria-hidden="true" className={`size-3.5 transition-transform ${isProjectsExpanded ? "" : "-rotate-90"}`} />
                    </button>
                    {isProjectsExpanded && <ul className="pb-1">
                        {(projects ?? []).map((project) => (
                            <li key={project.id} className="py-0.25">
                                <NavItemBase
                                    type="collapsible-child"
                                    href={`/projects/${project.id}`}
                                    current={location.pathname === `/projects/${project.id}` || location.pathname.startsWith(`/projects/${project.id}/`)}
                                    truncate={false}
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <ProjectIcon icon={project.icon} className="size-4 shrink-0 text-fg-quaternary" />
                                        <span className="min-w-0 flex-1 truncate">{project.name}</span>
                                        <span className="font-mono text-[10px] text-tertiary">{project.issueKey}</span>
                                    </span>
                                </NavItemBase>
                            </li>
                        ))}
                    </ul>}
                </li>
            )}
            {activeProjectId && activeColumns?.[0] && (
                <li className="mt-2 px-1">
                    <Button size="sm" iconLeading={Plus} color="secondary" className="w-full justify-start" onClick={() => setIsCreateOpen(true)}>
                        New issue
                    </Button>
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
            {isCreateOpen && activeColumns?.[0] && (
                <IssueQuickCreateModal
                    projectId={activeProjectId}
                    columnId={activeColumns[0].id}
                    onClose={() => setIsCreateOpen(false)}
                    onCreated={(identifier) => navigate(`/projects/${activeProjectId}/issues/${identifier}`)}
                />
            )}
        </>
    );
};
