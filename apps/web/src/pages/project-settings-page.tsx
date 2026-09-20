import { useParams } from "react-router";
import { ColumnsPanel } from "@/features/board/components/columns-panel";
import { CategoriesPanel } from "@/features/categories/components/categories-panel";
import { MembersPanel } from "@/features/projects/components/members-panel";
import { ProjectDetailsPanel } from "@/features/projects/components/project-details-panel";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProjectPermissions } from "@/features/projects/hooks/use-project-permissions";
import { NotFound } from "./not-found";

const sections = { general: ProjectDetailsPanel, states: ColumnsPanel, members: MembersPanel, labels: CategoriesPanel };
export function ProjectSettingsPage() {
    const { projectId = "", section = "general" } = useParams();
    const { isProjectOwner } = useProjectPermissions(projectId);
    const Panel = sections[section as keyof typeof sections];
    if (!Panel) return <NotFound />;
    return (
        <div className="flex h-full min-h-0 flex-col">
            <ProjectWorkspaceHeader projectId={projectId} activeView="settings" />
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className={section === "members" ? "w-full px-6 py-9 lg:px-12" : "mx-auto w-full max-w-[948px] px-6 py-9"}>
                    <Panel key={`${projectId}:${section}`} projectId={projectId} isProjectOwner={isProjectOwner} />
                </div>
            </div>
        </div>
    );
}
