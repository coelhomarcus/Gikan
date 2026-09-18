import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Input } from "@/components/base/input/input";
import { LoadingState } from "@/components/feedback/loading-state";
import { useProjects } from "../hooks/use-projects";
import { ProjectIcon } from "./project-icon";

interface ProjectSearchModalProps {
    onClose: () => void;
}

export const ProjectSearchModal = ({ onClose }: ProjectSearchModalProps) => {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { data: projects } = useProjects();
    const navigate = useNavigate();

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        const list = projects ?? [];
        if (!normalized) return list;
        return list.filter((project) => `${project.name} ${project.issueKey} ${project.description ?? ""}`.toLowerCase().includes(normalized));
    }, [projects, query]);

    useEffect(() => setSelectedIndex(0), [query]);

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
                                aria-label="Search projects"
                                placeholder="Search projects..."
                                icon={Search}
                                value={query}
                                onChange={setQuery}
                                onKeyDown={(event) => {
                                    if (event.key === "ArrowDown") {
                                        event.preventDefault();
                                        setSelectedIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
                                    }
                                    if (event.key === "ArrowUp") {
                                        event.preventDefault();
                                        setSelectedIndex((index) => Math.max(index - 1, 0));
                                    }
                                    if (event.key === "Enter" && filtered[selectedIndex]) openProject(filtered[selectedIndex].id);
                                }}
                            />
                        </div>

                        <div className="flex flex-col overflow-y-auto p-2">
                            {!projects ? (
                                <LoadingState label="Loading projects..." className="px-3 py-4" />
                            ) : filtered.length === 0 ? (
                                <p className="p-4 text-center text-sm text-tertiary">{projects.length === 0 ? "You don't have any projects yet" : "No projects found"}</p>
                            ) : (
                                filtered.map((project, index) => (
                                    <button
                                        key={project.id}
                                        type="button"
                                        onClick={() => openProject(project.id)}
                                        className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-left transition duration-100 ease-linear hover:bg-primary_hover ${
                                            index === selectedIndex ? "bg-secondary" : ""
                                        }`}
                                        aria-current={index === selectedIndex ? "true" : undefined}
                                    >
                                        <ProjectIcon icon={project.icon} className="size-4 shrink-0 text-fg-quaternary" />
                                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <span className="flex min-w-0 items-baseline gap-2">
                                                <span className="truncate text-sm font-medium text-primary">{project.name}</span>
                                                <span className="shrink-0 font-mono text-[11px] text-tertiary">{project.issueKey}</span>
                                            </span>
                                            {project.description && <span className="line-clamp-1 text-xs text-tertiary">{project.description}</span>}
                                        </span>
                                        {index === selectedIndex && <span className="font-mono text-[11px] text-tertiary">↵</span>}
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
