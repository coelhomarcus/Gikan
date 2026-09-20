import { type RegisterInput, registerSchema } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ControlledInput } from "@/components/form/controlled-input";
import { AUTH_QUERY_KEY, register } from "@/features/auth/api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/i18n/language-provider";

export const RegisterPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { locale } = useLanguage();

    const { control, handleSubmit, setError, formState } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: "", username: "", email: "", password: "", specialCode: "", locale },
    });

    const mutation = useMutation({
        mutationFn: register,
        onSuccess: (authUser) => {
            queryClient.setQueryData(AUTH_QUERY_KEY, authUser);
            navigate("/", { replace: true });
        },
        onError: (error) => {
            setError("root", { message: error instanceof ApiError ? error.message : t("auth.unableToCreateAccount") });
        },
    });

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-display-xs font-semibold text-primary">{t("auth.createAccount")}</h1>
                <p className="text-sm text-tertiary">{t("auth.registrationRequiresCode")}</p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => mutation.mutate({ ...data, locale }))} noValidate>
                <ControlledInput control={control} name="name" label={t("auth.name")} isRequired autoFocus />
                <ControlledInput control={control} name="username" label={t("auth.username")} isRequired hint={t("auth.usernameHint")} />
                <ControlledInput control={control} name="email" label={t("auth.email")} type="email" isRequired />
                <ControlledInput control={control} name="password" label={t("auth.password")} type="password" isRequired hint={t("auth.passwordHint")} />
                <ControlledInput control={control} name="specialCode" label={t("auth.specialCode")} isRequired />

                {formState.errors.root && <p className="text-sm text-danger-primary">{formState.errors.root.message}</p>}

                <Button type="submit" size="lg" isLoading={mutation.isPending}>
                    {t("auth.createAccount")}
                </Button>
            </form>

            <p className="text-center text-sm text-tertiary">
                {t("auth.alreadyHaveAccount")}{" "}
                <Link to="/login" className="font-semibold text-accent-primary hover:underline">
                    {t("auth.signIn")}
                </Link>
            </p>
        </div>
    );
};
