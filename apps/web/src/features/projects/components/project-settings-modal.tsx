import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Tabs } from "@/components/application/tabs/tabs";
import { CloseButton } from "@/components/base/buttons/close-button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { CategoriesPanel } from "@/features/categories/components/categories-panel";
import { useProject } from "@/features/projects/hooks/use-project";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { MembersPanel } from "@/features/projects/components/members-panel";
import { ProjectDetailsPanel } from "@/features/projects/components/project-details-panel";

interface ProjectSettingsModalProps {
    projectId: string;
    onClose: () => void;
}

export const ProjectSettingsModal = ({ projectId, onClose }: ProjectSettingsModalProps) => {
    const { user } = useAuth();
    const { data: project } = useProject(projectId);
    const { data: members } = useProjectMembers(projectId);

    const currentMembership = members?.find((member) => member.username === user?.username);
    const isProjectOwner = user?.isAdmin || currentMembership?.role === "owner";

    return (
        <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="max-w-3xl">
                <Dialog>
                    <div className="flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-xl bg-primary shadow-xl ring-1 ring-secondary">
                        <div className="flex items-start justify-between gap-4 p-6 pb-0">
                            <h2 className="text-lg font-semibold text-primary">{project ? `${project.name} · Configurações` : "Configurações do projeto"}</h2>
                            <CloseButton size="sm" onPress={onClose} />
                        </div>
                        <div className="p-6">
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
                                    <ProjectDetailsPanel projectId={projectId} isProjectOwner={!!isProjectOwner} />
                                </Tabs.Panel>
                                <Tabs.Panel id="members" className="pt-5">
                                    <MembersPanel projectId={projectId} isProjectOwner={!!isProjectOwner} />
                                </Tabs.Panel>
                                <Tabs.Panel id="categories" className="pt-5">
                                    <CategoriesPanel projectId={projectId} isProjectOwner={!!isProjectOwner} />
                                </Tabs.Panel>
                            </Tabs>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
