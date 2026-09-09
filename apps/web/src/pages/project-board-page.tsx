import { useParams } from "react-router";
import { Board } from "@/features/board/components/board";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";

export const ProjectBoardPage = () => {
    const { projectId } = useParams<{ projectId: string }>();

    return (
        <div className="flex h-dvh flex-col">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="board" />
            <div className="min-h-0 flex-1 overflow-x-auto p-4 lg:p-6">
                <Board projectId={projectId!} />
            </div>
        </div>
    );
};
