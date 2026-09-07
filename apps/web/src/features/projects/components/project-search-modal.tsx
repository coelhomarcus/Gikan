import { useMemo, useState } from "react";
import { SearchLg } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Input } from "@/components/base/input/input";
import { useProjects } from "../hooks/use-projects";
import { ProjectIcon } from "./project-icon";

interface ProjectSearchModalProps {
    onClose: () => void;
}

export const ProjectSearchModal = ({ onClose }: ProjectSearchModalProps) => {
    const [query, setQuery] = useState("");
    const { data: projects } = useProjects();
    const navigate = useNavigate();

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        const list = projects ?? [];
        if (!normalized) return list;
        return list.filter((project) => project.name.toLowerCase().includes(normalized));
    }, [projects, query]);

    function openProject(projectId: string) {
        navigate(`/projects/${projectId}`);
        onClose();
    }

    return (
        <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="max-w-lg">
                <Dialog>
                    <div className="flex max-h-[70vh] w-full flex-col overflow-hidden rounded-xl bg-primary shadow-xl ring-1 ring-secondary">
                        <div className="border-b border-secondary p-3">
                            <Input
                                autoFocus
                                aria-label="Buscar projetos"
                                placeholder="Buscar projetos..."
                                icon={SearchLg}
                                value={query}
                                onChange={setQuery}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && filtered.length > 0) {
                                        openProject(filtered[0].id);
                                    }
                                }}
                            />
                        </div>

                        <div className="flex flex-col overflow-y-auto p-2">
                            {filtered.length === 0 ? (
                                <p className="p-4 text-center text-sm text-tertiary">
                                    {projects && projects.length === 0 ? "Você ainda não tem projetos" : "Nenhum projeto encontrado"}
                                </p>
                            ) : (
                                filtered.map((project) => (
                                    <button
                                        key={project.id}
                                        type="button"
                                        onClick={() => openProject(project.id)}
                                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition duration-100 ease-linear hover:bg-primary_hover"
                                    >
                                        <ProjectIcon icon={project.icon} className="size-4 shrink-0 text-fg-quaternary" />
                                        <span className="flex min-w-0 flex-col gap-0.5">
                                            <span className="truncate text-sm font-medium text-primary">{project.name}</span>
                                            {project.description && <span className="line-clamp-1 text-xs text-tertiary">{project.description}</span>}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
