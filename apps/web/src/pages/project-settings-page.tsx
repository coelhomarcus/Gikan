import { useParams } from "react-router";
import { Tabs } from "@/components/application/tabs/tabs";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { CategoriesPanel } from "@/features/categories/components/categories-panel";
import { useProject } from "@/features/projects/hooks/use-project";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { MembersPanel } from "@/features/projects/components/members-panel";
import { ProjectDetailsPanel } from "@/features/projects/components/project-details-panel";

export const ProjectSettingsPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useAuth();
    const { data: project } = useProject(projectId!);
    const { data: members } = useProjectMembers(projectId!);

    const currentMembership = members?.find((member) => member.username === user?.username);
    const isProjectOwner = user?.isAdmin || currentMembership?.role === "owner";

    return (
        <>
            <Topbar title={project ? `${project.name} · Configurações` : "Configurações do projeto"} />
            <div className="p-4 lg:p-6">
                <Tabs>
                    <Tabs.List
                        type="button-border"
                        items={[
                            { id: "general", label: "Geral" },
                            { id: "members", label: "Membros" },
                            { id: "categories", label: "Categorias" },
                        ]}
                    />
                    <Tabs.Panel id="general" className="pt-5">
                        <ProjectDetailsPanel projectId={projectId!} isProjectOwner={!!isProjectOwner} />
                    </Tabs.Panel>
                    <Tabs.Panel id="members" className="pt-5">
                        <MembersPanel projectId={projectId!} isProjectOwner={!!isProjectOwner} />
                    </Tabs.Panel>
                    <Tabs.Panel id="categories" className="pt-5">
                        <CategoriesPanel projectId={projectId!} isProjectOwner={!!isProjectOwner} />
                    </Tabs.Panel>
                </Tabs>
            </div>
        </>
    );
};
