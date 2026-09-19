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
                <div className="mx-auto w-full max-w-4xl px-6 py-8 md:px-10">
                    <header className="mb-7 border-b border-subtle pb-5">
                        <h1 className="text-xl font-medium">{entry.title}</h1>
                        <p className="mt-1 text-sm text-tertiary">{entry.description}</p>
                    </header>
                    <entry.Panel projectId={projectId} isProjectOwner={isProjectOwner} />
                </div>
            </div>
        </div>
    );
}
