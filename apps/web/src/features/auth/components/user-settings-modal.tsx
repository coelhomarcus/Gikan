import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfileSchema } from "@gikan/shared";
import { Download01 } from "@untitledui/icons";
import { useForm } from "react-hook-form";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { ControlledInput } from "@/components/form/controlled-input";
import { AUTH_QUERY_KEY, updateProfile } from "@/features/auth/api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

function initialsOf(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join("");
}

interface UserSettingsModalProps {
    onClose: () => void;
}

export const UserSettingsModal = ({ onClose }: UserSettingsModalProps) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { control, handleSubmit, watch, setError, formState } = useForm({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: { name: user?.name ?? "", avatarUrl: user?.avatarUrl ?? "" },
    });

    const mutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(AUTH_QUERY_KEY, updatedUser);
        },
        onError: (error) => {
            setError("root", { message: error instanceof ApiError ? error.message : "Não foi possível salvar" });
        },
    });

    if (!user) {
        return null;
    }

    const previewUrl = watch("avatarUrl");

    return (
        <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="max-w-lg">
                <Dialog>
                    <div className="flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-xl bg-primary p-6 shadow-xl ring-1 ring-secondary">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <h2 className="text-lg font-semibold text-primary">Configurações</h2>
                            <CloseButton size="sm" onPress={onClose} />
                        </div>
                        <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit((data) => mutation.mutate(data))}>
                            <div className="flex items-center gap-4">
                                <Avatar src={previewUrl || undefined} initials={initialsOf(user.name)} size="xl" />
                                <div className="flex-1">
                                    <ControlledInput control={control} name="avatarUrl" label="URL da foto de perfil" placeholder="https://..." />
                                </div>
                            </div>

                            <ControlledInput control={control} name="name" label="Nome" isRequired />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-secondary">Usuário</p>
                                    <p className="mt-1.5 text-sm text-tertiary">@{user.username}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-secondary">Email</p>
                                    <p className="mt-1.5 truncate text-sm text-tertiary">{user.email}</p>
                                </div>
                            </div>

                            {formState.errors.root && <p className="text-sm text-error-primary">{formState.errors.root.message}</p>}
                            {mutation.isSuccess && !formState.isDirty && <p className="text-sm text-success-primary">Salvo!</p>}

                            <div className="flex justify-end">
                                <Button type="submit" isLoading={mutation.isPending}>
                                    Salvar
                                </Button>
                            </div>
                        </form>

                        {user.isAdmin && (
                            <div className="mt-6 flex flex-col gap-3 border-t border-secondary pt-5">
                                <div>
                                    <p className="text-sm font-medium text-secondary">Administração</p>
                                    <p className="mt-1 text-sm text-tertiary">
                                        Baixa um arquivo com todos os dados do banco (projetos, cards, colunas, categorias, membros e usuários),
                                        útil pra restaurar a plataforma caso o banco precise ser recriado do zero.
                                    </p>
                                </div>
                                <Button href="/api/admin/backup" download color="secondary" size="sm" iconLeading={Download01} className="w-fit">
                                    Baixar backup do banco
                                </Button>
                            </div>
                        )}
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
