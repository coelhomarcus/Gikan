import { useState } from "react";
import { AddOutline, ChevronDownOutline, ChevronRightOutline, LabelsOutline, MembersOutline, StateOutline } from "@makeplane/propel/icons";
import { Link, useLocation, useNavigate } from "react-router";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { AppIcons } from "@/components/foundations/icons";
import type { AppIcon } from "@/components/foundations/icons";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useColumns } from "@/features/board/hooks/use-board";
import { IssueQuickCreateModal } from "@/features/issues/components/issue-quick-create-modal";
import { ProjectIcon } from "@/features/projects/components/project-icon";
import { useProjects } from "@/features/projects/hooks/use-projects";

export function Sidebar({ onCollapse }: { onCollapse: () => void }) {
    const location = useLocation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: projects } = useProjects();
    const projectId = location.pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? "";
    const { data: columns } = useColumns(projectId);
    const [creating, setCreating] = useState(false);
    const [expanded, setExpanded] = useState(() => localStorage.getItem("gikan-projects-expanded") !== "false");
    const settings = location.pathname === "/settings/profile";
    const projectSettings = location.pathname.includes("/settings/");
    const navClass = "flex min-h-7 items-center gap-2 rounded-md px-2 py-1 text-sm text-secondary hover:bg-layer-transparent-hover";
    const views: Array<[string, string, AppIcon]> = [
        ["", "Overview", AppIcons.Overview],
        ["/issues", "Issues", AppIcons.Issues],
        ["/cycles", "Cycles", AppIcons.Cycles],
        ["/documents", "Documents", AppIcons.Documents],
    ];
    return (
        <div className="flex h-full flex-col pt-3">
            <div className="flex items-center justify-between px-5 pb-3">
                <span className="text-lg font-medium">{settings ? "Settings" : projectSettings ? "Project settings" : "Projects"}</span>
                <ButtonUtility icon={AppIcons.Menu} tooltip="Collapse navigation" color="tertiary" onClick={onCollapse} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3">
                {settings ? (
                    <>
                        <div className="mb-6 flex min-w-0 items-center gap-3 px-2 py-2">
                            <Avatar key={user?.avatarUrl} size="md" src={user?.avatarUrl} initials={user?.name.slice(0, 2).toUpperCase()} />
                            <div className="min-w-0">
                                <p className="truncate text-body-sm-medium text-secondary">{user?.name}</p>
                                <p className="truncate text-caption-md-regular text-tertiary">{user?.email}</p>
                            </div>
                        </div>
                        <p className="px-2 py-2 text-caption-md-medium text-tertiary">Account</p>
                        <Link to="/settings/profile" className={`${navClass} bg-layer-1`} aria-current="page">
                            <AppIcons.General className="size-4" />
                            General
                        </Link>
                    </>
                ) : projectSettings ? (
                    <>
                        <Link to={`/projects/${projectId}`} className={`${navClass} mb-4`}>
                            <AppIcons.Back className="size-4" />
                            Back to project
                        </Link>
                        {[
                            { section: "general", label: "General", Icon: AppIcons.General },
                            { section: "states", label: "States", Icon: StateOutline },
                            { section: "members", label: "Members", Icon: MembersOutline },
                            { section: "labels", label: "Labels", Icon: LabelsOutline },
                        ].map(({ section, label, Icon }) => (
                            <Link
                                key={section}
                                to={`/projects/${projectId}/settings/${section}`}
                                className={`${navClass} ${location.pathname.endsWith(`/${section}`) ? "bg-layer-1 text-primary" : ""}`}
                                aria-current={location.pathname.endsWith(`/${section}`) ? "page" : undefined}
                            >
                                <Icon className="size-4 shrink-0" />
                                {label}
                            </Link>
                        ))}
                    </>
                ) : (
                    <>
                        {projectId && columns?.[0] && (
                            <Button color="secondary" className="mb-3 w-full justify-start" iconLeading={AddOutline} onClick={() => setCreating(true)}>
                                New issue
                            </Button>
                        )}
                        <Link
                            to="/"
                            className={`${navClass} ${location.pathname === "/" ? "bg-layer-1 text-primary" : ""}`}
                            aria-current={location.pathname === "/" ? "page" : undefined}
                        >
                            <AppIcons.Projects className="size-4" />
                            All projects
                        </Link>
                        <button
                            className="mt-5 mb-1 flex w-full items-center gap-1 px-2 py-1 text-xs font-medium text-tertiary"
                            aria-expanded={expanded}
                            onClick={() =>
                                setExpanded((value) => {
                                    localStorage.setItem("gikan-projects-expanded", String(!value));
                                    return !value;
                                })
                            }
                        >
                            <ChevronDownOutline className={`size-3 transition-transform ${expanded ? "" : "-rotate-90"}`} />
                            Your projects
                        </button>
                        {expanded &&
                            (projects ?? []).map((project) => (
                                <div key={project.id} className="mb-1">
                                    <Link
                                        to={`/projects/${project.id}`}
                                        className={`${navClass} font-medium ${projectId === project.id ? "text-primary" : ""}`}
                                    >
                                        <ProjectIcon icon={project.icon} className="size-4 shrink-0 text-tertiary" />
                                        <span className="truncate">{project.name}</span>
                                        <ChevronRightOutline className={`ml-auto size-3 shrink-0 ${projectId === project.id ? "rotate-90" : ""}`} />
                                    </Link>
                                    {projectId === project.id && (
                                        <nav aria-label={`${project.name} views`} className="ml-4 border-l border-subtle pl-2">
                                            {views.map(([suffix, label, Icon]) => {
                                                const active =
                                                    suffix === "/issues"
                                                        ? /\/(issues|board)(\/|$)/.test(location.pathname)
                                                        : location.pathname === `/projects/${project.id}${suffix}`;
                                                return (
                                                    <Link
                                                        key={label}
                                                        to={`/projects/${project.id}${suffix}`}
                                                        className={`${navClass} ${active ? "bg-layer-1 text-primary" : ""}`}
                                                        aria-current={active ? "page" : undefined}
                                                    >
                                                        <Icon className="size-4 shrink-0" />
                                                        {label}
                                                    </Link>
                                                );
                                            })}
                                            <Link to={`/projects/${projectId}/settings/general`} className={navClass}>
                                                <AppIcons.Settings className="size-4" />
                                                Settings
                                            </Link>
                                        </nav>
                                    )}
                                </div>
                            ))}
                    </>
                )}
            </div>
            <div className="flex h-12 shrink-0 items-center border-t border-subtle px-5 text-xs text-placeholder">Gikan</div>
            {creating && columns?.[0] && (
                <IssueQuickCreateModal
                    projectId={projectId}
                    columnId={columns[0].id}
                    onClose={() => setCreating(false)}
                    onCreated={(identifier) => {
                        setCreating(false);
                        navigate(`/projects/${projectId}/issues/${identifier}`);
                    }}
                />
            )}
        </div>
    );
}
