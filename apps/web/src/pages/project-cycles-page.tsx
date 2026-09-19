import { useParams } from "react-router";
import { CyclesPanel } from "@/features/projects/components/cycles-panel";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProjectPermissions } from "@/features/projects/hooks/use-project-permissions";

export function ProjectCyclesPage() {
    const { projectId = "" } = useParams();
    const { isProjectOwner } = useProjectPermissions(projectId);
    return (
        <div className="flex h-full min-h-0 flex-col">
            <ProjectWorkspaceHeader projectId={projectId} activeView="cycles" />
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto max-w-5xl">
                    <CyclesPanel projectId={projectId} isProjectOwner={isProjectOwner} />
                </div>
            </div>
        </div>
    );
}
