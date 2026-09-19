import { type LoginInput, loginSchema } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
            setError("root", { message: error instanceof ApiError ? error.message : "Unable to sign in" });
        },
    });

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-display-xs font-semibold text-primary">Sign in</h1>
                <p className="text-sm text-tertiary">Sign in to your account to continue</p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
                <ControlledInput control={control} name="identifier" label="Username or email" isRequired autoFocus />
                <ControlledInput control={control} name="password" label="Password" type="password" isRequired />

                {formState.errors.root && <p className="text-sm text-danger-primary">{formState.errors.root.message}</p>}

                <Button type="submit" size="lg" isLoading={mutation.isPending}>
                    Sign in
                </Button>
            </form>

            <p className="text-center text-sm text-tertiary">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-accent-primary hover:underline">
                    Create an account
                </Link>
            </p>
        </div>
    );
};
