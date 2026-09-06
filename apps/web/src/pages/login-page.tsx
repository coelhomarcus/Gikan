import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type LoginInput, loginSchema } from "@todokanban/shared";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ControlledInput } from "@/components/form/controlled-input";
import { AUTH_QUERY_KEY, login } from "@/features/auth/api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

export const LoginPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { control, handleSubmit, setError, formState } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { identifier: "", password: "" },
    });

    const mutation = useMutation({
        mutationFn: login,
        onSuccess: (authUser) => {
            queryClient.setQueryData(AUTH_QUERY_KEY, authUser);
            navigate("/", { replace: true });
        },
        onError: (error) => {
            setError("root", { message: error instanceof ApiError ? error.message : "Não foi possível entrar" });
        },
    });

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-display-xs font-semibold text-primary">Entrar</h1>
                <p className="text-sm text-tertiary">Acesse sua conta para continuar</p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
                <ControlledInput control={control} name="identifier" label="Usuário ou email" isRequired autoFocus />
                <ControlledInput control={control} name="password" label="Senha" type="password" isRequired />

                {formState.errors.root && <p className="text-sm text-error-primary">{formState.errors.root.message}</p>}

                <Button type="submit" size="lg" isLoading={mutation.isPending}>
                    Entrar
                </Button>
            </form>

            <p className="text-center text-sm text-tertiary">
                Não tem conta? <Link to="/register" className="font-semibold text-brand-secondary hover:underline">Criar conta</Link>
            </p>
        </div>
    );
};
