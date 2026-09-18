import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Tabs } from "@/components/application/tabs/tabs";
import { CloseButton } from "@/components/base/buttons/close-button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ColumnsPanel } from "@/features/board/components/columns-panel";
import { CategoriesPanel } from "@/features/categories/components/categories-panel";
import { MembersPanel } from "@/features/projects/components/members-panel";
import { CyclesPanel } from "@/features/projects/components/cycles-panel";
import { ProjectDetailsPanel } from "@/features/projects/components/project-details-panel";
import { useProject } from "@/features/projects/hooks/use-project";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";

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
            <Modal className="max-w-5xl">
                <Dialog>
                    <div className="flex max-h-[min(88vh,760px)] w-full min-w-0 flex-col overflow-hidden rounded-xl bg-primary shadow-xl ring-1 ring-secondary">
                        <div className="flex shrink-0 items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
                            <h2 className="text-lg font-semibold text-primary">{project ? `${project.name} · Settings` : "Project settings"}</h2>
                            <CloseButton size="sm" onPress={onClose} />
                        </div>
                        <div className="flex min-h-0 min-w-0 flex-1 p-5 pt-4 sm:p-6 sm:pt-5">
                            <Tabs className="min-h-0 min-w-0 flex-1 md:flex-row">
                                <Tabs.List
                                    orientation="vertical"
                                    type="line"
                                    className="w-full shrink-0 pb-4 md:w-40 md:border-r md:border-secondary md:pr-4 md:pb-0"
                                    items={[
                                        { id: "general", label: "General" },
                                        { id: "columns", label: "Statuses" },
                                        { id: "members", label: "Members" },
                                        { id: "categories", label: "Labels" },
                                        { id: "cycles", label: "Cycles" },
                                    ]}
                                />
                                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto md:pl-6">
                                    <Tabs.Panel id="general" className="w-full pt-0">
                                        <ProjectDetailsPanel projectId={projectId} isProjectOwner={!!isProjectOwner} />
                                    </Tabs.Panel>
                                    <Tabs.Panel id="columns" className="w-full pt-0">
                                        <ColumnsPanel projectId={projectId} isProjectOwner={!!isProjectOwner} />
                                    </Tabs.Panel>
                                    <Tabs.Panel id="members" className="w-full pt-0">
                                        <MembersPanel projectId={projectId} isProjectOwner={!!isProjectOwner} />
                                    </Tabs.Panel>
                                    <Tabs.Panel id="categories" className="w-full pt-0">
                                        <CategoriesPanel projectId={projectId} isProjectOwner={!!isProjectOwner} />
                                    </Tabs.Panel>
                                    <Tabs.Panel id="cycles" className="w-full pt-0">
                                        <CyclesPanel projectId={projectId} isProjectOwner={!!isProjectOwner} />
                                    </Tabs.Panel>
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
