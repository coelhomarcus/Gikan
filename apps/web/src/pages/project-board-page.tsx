import { useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { Board } from "@/features/board/components/board";
import { useColumns } from "@/features/board/hooks/use-board";
import { IssueQuickCreateModal } from "@/features/issues/components/issue-quick-create-modal";
import { IssueToolbar } from "@/features/issues/components/issue-toolbar";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";

export function ProjectBoardPage() {
    const { projectId = "" } = useParams();
    const [params] = useSearchParams();
    const { data: columns } = useColumns(projectId);
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <div className="plane-board-page flex h-full min-h-0 flex-col">
            <ProjectWorkspaceHeader projectId={projectId} activeView="board" actions={<IssueToolbar compact projectId={projectId} layout="board" onCreate={() => setCreating(true)} />} />
            <div className="min-h-0 flex-1 overflow-x-auto bg-layer-1 px-[22px] pt-4 pb-4">
                <Board projectId={projectId} filters={params} />
            </div>
            {creating && columns?.[0] && (
                <IssueQuickCreateModal
                    projectId={projectId}
                    columnId={columns[0].id}
                    onClose={() => setCreating(false)}
                    onCreated={(identifier) => {
                        setCreating(false);
                        navigate(`/projects/${projectId}/issues/${identifier}`, { state: { backgroundLocation: location } });
                    }}
                />
            )}
        </div>
    );
}
