import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { AppIcons } from "@/components/foundations/icons";
import { Topbar } from "@/components/layout/topbar";
import { useProject } from "@/features/projects/hooks/use-project";
import { ProjectIcon } from "./project-icon";
import { ProjectSettingsModal } from "./project-settings-modal";

interface ProjectWorkspaceHeaderProps {
    projectId: string;
    activeView: "overview" | "issues" | "board" | "documents";
}

export const ProjectWorkspaceHeader = ({ projectId, activeView }: ProjectWorkspaceHeaderProps) => {
    const navigate = useNavigate();
    const { data: project } = useProject(projectId);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const overviewPath = `/projects/${projectId}`;
    const issuesPath = `${overviewPath}/issues`;
    const boardPath = `${overviewPath}/board`;
    const documentsPath = `${overviewPath}/documents`;

    return (
        <>
            <Topbar
                title={
                    <span className="flex min-w-0 items-center gap-2">
                        <ProjectIcon icon={project?.icon} className="size-4.5 shrink-0 text-fg-quaternary" />
                        <span className="truncate">{project?.name ?? "Project"}</span>
                    </span>
                }
                onBack={() => navigate("/")}
                actions={
                    <div className="flex items-center gap-2">
                        {project?.repositoryUrl && (
                            <ButtonUtility
                                icon={AppIcons.ExternalLink}
                                size="sm"
                                color="tertiary"
                                tooltip="Open repository"
                                href={project.repositoryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            />
                        )}
                        <ButtonUtility icon={AppIcons.Settings} size="sm" color="tertiary" tooltip="Settings" onClick={() => setIsSettingsOpen(true)} />
                    </div>
                }
            />

            <nav aria-label="Project views" className="flex h-9 shrink-0 items-center gap-2 overflow-x-auto border-b border-secondary px-3 lg:px-4">
                <ProjectViewLink href={overviewPath} active={activeView === "overview"} icon={AppIcons.Overview}>
                    Overview
                </ProjectViewLink>
                <ProjectViewLink href={issuesPath} active={activeView === "issues"} icon={AppIcons.Issues}>
                    Issues
                </ProjectViewLink>
                <ProjectViewLink href={boardPath} active={activeView === "board"} icon={AppIcons.Board}>
                    Board
                </ProjectViewLink>
                <ProjectViewLink href={documentsPath} active={activeView === "documents"} icon={AppIcons.Documents}>
                    Documents
                </ProjectViewLink>
            </nav>

            {isSettingsOpen && <ProjectSettingsModal projectId={projectId} onClose={() => setIsSettingsOpen(false)} />}
        </>
    );
};

function ProjectViewLink({ href, active, icon: Icon, children }: { href: string; active: boolean; icon: typeof AppIcons.Overview; children: React.ReactNode }) {
    return (
        <Button
            href={href}
            color={active ? "secondary" : "tertiary"}
            size="sm"
            iconLeading={Icon}
            aria-current={active ? "page" : undefined}
            className="shrink-0"
        >
            {children}
        </Button>
    );
}
