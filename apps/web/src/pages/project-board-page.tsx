import { useState } from "react";
import { LinkExternal01, Settings01 } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Topbar } from "@/components/layout/topbar";
import { Board } from "@/features/board/components/board";
import { ProjectSettingsModal } from "@/features/projects/components/project-settings-modal";
import { useProject } from "@/features/projects/hooks/use-project";

export const ProjectBoardPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { data: project } = useProject(projectId!);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="flex h-dvh flex-col">
            <Topbar
                title={project?.name ?? "Board"}
                onBack={() => navigate("/")}
                actions={
                    <div className="flex items-center gap-2">
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
                        <Button onClick={() => setIsSettingsOpen(true)} color="secondary" size="sm" iconLeading={Settings01}>
                            Configurações
                        </Button>
                    </div>
                }
            />
            <div className="min-h-0 flex-1 overflow-x-auto p-4 lg:p-6">
                <Board projectId={projectId!} />
            </div>
            {isSettingsOpen && <ProjectSettingsModal projectId={projectId!} onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
};
