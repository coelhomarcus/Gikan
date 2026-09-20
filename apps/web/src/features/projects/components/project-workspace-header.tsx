import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { AppIcons } from "@/components/foundations/icons";
import { Topbar } from "@/components/layout/topbar";
import { useProject } from "@/features/projects/hooks/use-project";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { ProjectIcon } from "./project-icon";

export function ProjectWorkspaceHeader({
    projectId,
    activeView,
    actions,
}: {
    projectId: string;
    actions?: ReactNode;
    activeView: "overview" | "issues" | "board" | "documents" | "cycles" | "settings";
}) {
    const { data: projectData } = useProject(projectId);
    const { data: projects } = useProjects();
    const project = projectData ?? projects?.find((candidate) => candidate.id === projectId);
    const location = useLocation();
    const issues = activeView === "issues" || activeView === "board";
    const title = issues ? "Issues" : activeView.charAt(0).toUpperCase() + activeView.slice(1);
    return (
        <Topbar
            title={
                <span className="flex min-w-0 items-center gap-2">
                    <ProjectIcon icon={project?.icon} className="size-4 shrink-0 text-tertiary" />
                    <Link to={`/projects/${projectId}`} className="truncate text-secondary hover:text-primary">
                        {project?.name ?? "Project"}
                    </Link>
                    <span className="text-placeholder">/</span>
                    <span>{title}</span>
                </span>
            }
            actions={
                <>
                    {issues && (
                        <nav aria-label="Issue layout" className="flex gap-0.5 rounded-md border border-subtle p-0.5">
                            {(
                                [
                                    ["issues/list", "issues", "List", AppIcons.Issues],
                                    ["issues", "board", "Board", AppIcons.Board],
                                ] as const
                            ).map(([path, view, label, Icon]) => (
                                <Link
                                    key={path}
                                    to={`/projects/${projectId}/${path}${location.search}`}
                                    aria-label={`${label} layout`}
                                    aria-current={activeView === view ? "page" : undefined}
                                    className={`flex size-6 items-center justify-center rounded-sm text-tertiary hover:bg-layer-1-hover ${activeView === view ? "bg-layer-2 text-primary" : ""}`}
                                >
                                    <Icon className="size-3.5" />
                                </Link>
                            ))}
                        </nav>
                    )}
                    {actions}
                    {!actions && project?.repositoryUrl && (
                        <ButtonUtility
                            icon={AppIcons.ExternalLink}
                            color="tertiary"
                            tooltip="Open repository"
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        />
                    )}
                    {!actions && <Link
                        to={`/projects/${projectId}/settings/general`}
                        aria-label="Project settings"
                        className="flex size-6 items-center justify-center rounded text-tertiary hover:bg-layer-1-hover"
                    >
                        <AppIcons.Settings className="size-4" />
                    </Link>}
                </>
            }
        />
    );
}
