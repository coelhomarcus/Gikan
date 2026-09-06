import { zodResolver } from "@hookform/resolvers/zod";
import { updateProjectSchema } from "@gikan/shared";
import { LinkExternal01 } from "@untitledui/icons";
import { useForm } from "react-hook-form";
import { Button } from "@/components/base/buttons/button";
import { ErrorMessage } from "@/components/feedback/error-message";
import { ControlledInput } from "@/components/form/controlled-input";
import { ControlledTextarea } from "@/components/form/controlled-textarea";
import { ApiError } from "@/lib/api-client";
import { useProject } from "../hooks/use-project";
import { useUpdateProject } from "../hooks/use-projects";

interface ProjectDetailsPanelProps {
    projectId: string;
    isProjectOwner: boolean;
}

export const ProjectDetailsPanel = ({ projectId, isProjectOwner }: ProjectDetailsPanelProps) => {
    const { data: project, isLoading, isError } = useProject(projectId);
    const mutation = useUpdateProject(projectId);

    // Sem generic explícito no useForm: updateProjectSchema tem `.transform()` em `repositoryUrl`
    // (mesmo padrão de updateProfileSchema.avatarUrl), o que cria um input/output type diferente
    // no zod — deixar o TS inferir a partir do resolver evita o erro de tipo já visto antes.
    const { control, handleSubmit, setError, formState } = useForm({
        resolver: zodResolver(updateProjectSchema),
        values: project
            ? { name: project.name, description: project.description ?? "", repositoryUrl: project.repositoryUrl ?? "" }
            : undefined,
    });

    if (isLoading) return <p className="text-tertiary">Carregando...</p>;
    if (isError || !project) return <ErrorMessage message="Não foi possível carregar o projeto." />;

    if (!isProjectOwner) {
        return (
            <div className="flex max-w-lg flex-col gap-5">
                <div>
                    <p className="text-sm font-medium text-secondary">Nome</p>
                    <p className="mt-1.5 text-sm text-tertiary">{project.name}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-secondary">Descrição</p>
                    <p className="mt-1.5 text-sm text-tertiary">{project.description || "—"}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-secondary">Link do repositório</p>
                    {project.repositoryUrl ? (
                        <a
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-brand-secondary hover:underline"
                        >
                            {project.repositoryUrl}
                            <LinkExternal01 className="size-3.5 shrink-0" />
                        </a>
                    ) : (
                        <p className="mt-1.5 text-sm text-tertiary">—</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <form
            className="flex max-w-lg flex-col gap-5"
            noValidate
            onSubmit={handleSubmit((data) =>
                mutation.mutate(data, {
                    onError: (error) => {
                        setError("root", { message: error instanceof ApiError ? error.message : "Não foi possível salvar" });
                    },
                }),
            )}
        >
            <ControlledInput control={control} name="name" label="Nome" isRequired />
            <ControlledTextarea control={control} name="description" label="Descrição" rows={3} />
            <ControlledInput control={control} name="repositoryUrl" label="Link do repositório" placeholder="https://github.com/..." />

            {formState.errors.root && <p className="text-sm text-error-primary">{formState.errors.root.message}</p>}
            {mutation.isSuccess && !formState.isDirty && <p className="text-sm text-success-primary">Salvo!</p>}

            <div>
                <Button type="submit" isLoading={mutation.isPending}>
                    Salvar
                </Button>
            </div>
        </form>
    );
};
