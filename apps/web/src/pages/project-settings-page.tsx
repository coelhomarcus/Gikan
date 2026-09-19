import { useParams } from "react-router";
import { ColumnsPanel } from "@/features/board/components/columns-panel";
import { CategoriesPanel } from "@/features/categories/components/categories-panel";
import { MembersPanel } from "@/features/projects/components/members-panel";
import { ProjectDetailsPanel } from "@/features/projects/components/project-details-panel";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProjectPermissions } from "@/features/projects/hooks/use-project-permissions";
import { NotFound } from "./not-found";

const sections = {
    general: { title: "General", description: "Manage your project details.", Panel: ProjectDetailsPanel },
    states: { title: "States", description: "Define the workflow for your project.", Panel: ColumnsPanel },
    members: { title: "Members", description: "Manage the people working on this project.", Panel: MembersPanel },
    labels: { title: "Labels", description: "Organize and categorize your issues.", Panel: CategoriesPanel },
};
export function ProjectSettingsPage() {
    const { projectId = "", section = "general" } = useParams();
    const { isProjectOwner } = useProjectPermissions(projectId);
    const entry = sections[section as keyof typeof sections];
    if (!entry) return <NotFound />;
    return (
        <div className="flex h-full min-h-0 flex-col">
            <ProjectWorkspaceHeader projectId={projectId} activeView="settings" />
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className={section === "members" ? "w-full px-6 py-9 lg:px-12" : "mx-auto w-full max-w-[948px] px-6 py-9"}>
                    <entry.Panel key={`${projectId}:${section}`} projectId={projectId} isProjectOwner={isProjectOwner} />
                </div>
            </div>
        </div>
    );
}
