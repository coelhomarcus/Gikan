import { useState } from "react";
import { BookOpen01, Columns03, File06, LinkExternal01, List, Settings01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
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
                        <div className="flex rounded-lg bg-secondary_alt p-1 ring-1 ring-secondary ring-inset">
                            <Button href={overviewPath} color={activeView === "overview" ? "secondary" : "tertiary"} size="xs" iconLeading={File06}>
                                Overview
                            </Button>
                            <Button href={issuesPath} color={activeView === "issues" ? "secondary" : "tertiary"} size="xs" iconLeading={List}>
                                Issues
                            </Button>
                            <Button href={boardPath} color={activeView === "board" ? "secondary" : "tertiary"} size="xs" iconLeading={Columns03}>
                                Board
                            </Button>
                            <Button href={documentsPath} color={activeView === "documents" ? "secondary" : "tertiary"} size="xs" iconLeading={BookOpen01}>
                                Documents
                            </Button>
                        </div>

                        {project?.repositoryUrl && (
                            <ButtonUtility
                                icon={LinkExternal01}
                                size="sm"
                                color="tertiary"
                                tooltip="Open repository"
                                href={project.repositoryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            />
                        )}
                        <ButtonUtility icon={Settings01} size="sm" color="tertiary" tooltip="Settings" onClick={() => setIsSettingsOpen(true)} />
                    </div>
                }
            />

            {isSettingsOpen && <ProjectSettingsModal projectId={projectId} onClose={() => setIsSettingsOpen(false)} />}
        </>
    );
};
