import { zodResolver } from "@hookform/resolvers/zod";
import { type CreateProjectInput, createProjectSchema } from "@todokanban/shared";
import { Plus } from "@untitledui/icons";
import { useForm } from "react-hook-form";
import { Button } from "@/components/base/buttons/button";
import { ControlledInput } from "@/components/form/controlled-input";
import { ControlledTextarea } from "@/components/form/controlled-textarea";
import { ModalDialog } from "@/components/overlay/modal-dialog";
import { ApiError } from "@/lib/api-client";
import { useCreateProject } from "../hooks/use-projects";

export const CreateProjectModal = () => {
    const mutation = useCreateProject();
    const { control, handleSubmit, reset, setError, formState } = useForm<CreateProjectInput>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: { name: "", description: "" },
    });

    return (
        <ModalDialog trigger={<Button iconLeading={Plus}>Novo projeto</Button>} title="Novo projeto">
            {({ close }) => (
                <form
                    className="flex flex-col gap-4"
                    noValidate
                    onSubmit={handleSubmit((data) => {
                        mutation.mutate(data, {
                            onSuccess: () => {
                                reset();
                                close();
                            },
                            onError: (error) => {
                                setError("root", { message: error instanceof ApiError ? error.message : "Não foi possível criar o projeto" });
                            },
                        });
                    })}
                >
                    <ControlledInput control={control} name="name" label="Nome" isRequired autoFocus />
                    <ControlledTextarea control={control} name="description" label="Descrição" rows={3} />

                    {formState.errors.root && <p className="text-sm text-error-primary">{formState.errors.root.message}</p>}

                    <div className="mt-2 flex justify-end gap-3">
                        <Button type="button" color="secondary" onClick={close}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={mutation.isPending}>
                            Criar projeto
                        </Button>
                    </div>
                </form>
            )}
        </ModalDialog>
    );
};
