import { useState } from "react";
import { BookOpen01, Columns03, LinkExternal01, Settings01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Topbar } from "@/components/layout/topbar";
import { useProject } from "@/features/projects/hooks/use-project";
import { ProjectIcon } from "./project-icon";
import { ProjectSettingsModal } from "./project-settings-modal";

interface ProjectWorkspaceHeaderProps {
    projectId: string;
    activeView: "board" | "page";
}

export const ProjectWorkspaceHeader = ({ projectId, activeView }: ProjectWorkspaceHeaderProps) => {
    const navigate = useNavigate();
    const { data: project } = useProject(projectId);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const boardPath = `/projects/${projectId}`;
    const pagePath = `${boardPath}/page`;

    return (
        <>
            <Topbar
                title={
                    <span className="flex min-w-0 items-center gap-2">
                        <ProjectIcon icon={project?.icon} className="size-4.5 shrink-0 text-fg-quaternary" />
                        <span className="truncate">{project?.name ?? "Projeto"}</span>
                    </span>
                }
                onBack={() => navigate("/")}
                actions={
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-lg bg-secondary_alt p-1 ring-1 ring-secondary ring-inset">
                            <Button href={boardPath} color={activeView === "board" ? "secondary" : "tertiary"} size="xs" iconLeading={Columns03}>
                                Kanban
                            </Button>
                            <Button href={pagePath} color={activeView === "page" ? "secondary" : "tertiary"} size="xs" iconLeading={BookOpen01}>
                                Página
                            </Button>
                        </div>

                        {project?.repositoryUrl && (
                            <ButtonUtility
                                icon={LinkExternal01}
                                size="sm"
                                color="tertiary"
                                tooltip="Abrir repositório"
                                href={project.repositoryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            />
                        )}
                        <ButtonUtility icon={Settings01} size="sm" color="tertiary" tooltip="Configurações" onClick={() => setIsSettingsOpen(true)} />
                    </div>
                }
            />

            {isSettingsOpen && <ProjectSettingsModal projectId={projectId} onClose={() => setIsSettingsOpen(false)} />}
        </>
    );
};
