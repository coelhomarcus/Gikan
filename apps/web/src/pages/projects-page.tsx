import { ErrorMessage } from "@/components/feedback/error-message";
import { Topbar } from "@/components/layout/topbar";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { ProjectCard } from "@/features/projects/components/project-card";
import { useProjects } from "@/features/projects/hooks/use-projects";

export const ProjectsPage = () => {
    const { data: projects, isLoading, isError } = useProjects();

    return (
        <>
            <Topbar title="Projetos" actions={<CreateProjectModal />} />
            <div className="p-4 lg:p-6">
                {isLoading && <p className="text-tertiary">Carregando...</p>}

                {isError && <ErrorMessage message="Não foi possível carregar seus projetos. Tente recarregar a página." />}

                {!isLoading && !isError && projects?.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-secondary py-16 text-center">
                        <p className="font-semibold text-primary">Nenhum projeto ainda</p>
                        <p className="text-sm text-tertiary">Crie o primeiro projeto para começar a organizar suas tarefas.</p>
                    </div>
                )}

                {projects && projects.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
