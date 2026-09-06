import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type RegisterInput, registerSchema } from "@todokanban/shared";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ControlledInput } from "@/components/form/controlled-input";
import { AUTH_QUERY_KEY, register } from "@/features/auth/api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

export const RegisterPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { control, handleSubmit, setError, formState } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: "", username: "", email: "", password: "", specialCode: "" },
    });

    const mutation = useMutation({
        mutationFn: register,
        onSuccess: (authUser) => {
            queryClient.setQueryData(AUTH_QUERY_KEY, authUser);
            navigate("/", { replace: true });
        },
        onError: (error) => {
            setError("root", { message: error instanceof ApiError ? error.message : "Não foi possível criar a conta" });
        },
    });

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-display-xs font-semibold text-primary">Criar conta</h1>
                <p className="text-sm text-tertiary">O registro exige um código especial de convite</p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
                <ControlledInput control={control} name="name" label="Nome" isRequired autoFocus />
                <ControlledInput control={control} name="username" label="Usuário" isRequired hint="Só letras minúsculas, números e _" />
                <ControlledInput control={control} name="email" label="Email" type="email" isRequired />
                <ControlledInput control={control} name="password" label="Senha" type="password" isRequired hint="Mínimo de 8 caracteres" />
                <ControlledInput control={control} name="specialCode" label="Código especial" isRequired />

                {formState.errors.root && <p className="text-sm text-error-primary">{formState.errors.root.message}</p>}

                <Button type="submit" size="lg" isLoading={mutation.isPending}>
                    Criar conta
                </Button>
            </form>

            <p className="text-center text-sm text-tertiary">
                Já tem conta? <Link to="/login" className="font-semibold text-brand-secondary hover:underline">Entrar</Link>
            </p>
        </div>
    );
};
