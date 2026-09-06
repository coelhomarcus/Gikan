import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfileSchema } from "@gikan/shared";
import { useForm } from "react-hook-form";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { ControlledInput } from "@/components/form/controlled-input";
import { Topbar } from "@/components/layout/topbar";
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

export const SettingsPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Sem generic explícito no useForm: updateProfileSchema tem `.transform()` em `avatarUrl`
    // (aceita "" na entrada e vira `null` na saída), o que cria um input/output type diferente
    // no zod — deixar o TS inferir a partir do resolver evita o mesmo erro de tipo que já
    // corrigimos antes em quick-add-card.tsx (create) por causa do `.default()`.
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
        <>
            <Topbar title="Configurações" />
            <div className="p-4 lg:p-6">
                <form className="flex max-w-lg flex-col gap-5" noValidate onSubmit={handleSubmit((data) => mutation.mutate(data))}>
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

                    <div>
                        <Button type="submit" isLoading={mutation.isPending}>
                            Salvar
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
};
