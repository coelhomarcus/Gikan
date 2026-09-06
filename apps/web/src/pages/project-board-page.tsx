import { Settings01 } from "@untitledui/icons";
import { useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Topbar } from "@/components/layout/topbar";
import { Board } from "@/features/board/components/board";
import { useProject } from "@/features/projects/hooks/use-project";

export const ProjectBoardPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: project } = useProject(projectId!);

    return (
        <div className="flex h-dvh flex-col">
            <Topbar
                title={project?.name ?? "Board"}
                actions={
                    <Button href={`/projects/${projectId}/settings`} color="secondary" size="sm" iconLeading={Settings01}>
                        Configurações
                    </Button>
                }
            />
            <div className="min-h-0 flex-1 overflow-x-auto p-4 lg:p-6">
                <Board projectId={projectId!} />
            </div>
        </div>
    );
};
