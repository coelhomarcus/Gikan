import { updateProfileSchema } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Alert } from "@/components/base/feedback/alert";
import { ControlledSettingsInput as ControlledInput, SettingsInput as Input } from "@/components/settings/settings-input";
import { SettingsControl } from "@/components/settings/settings-layout";
import { AvatarUrlPicker } from "@/components/appearance/avatar-url-picker";
import { CoverImage } from "@/components/appearance/cover-image";
import { CoverPicker } from "@/components/appearance/cover-picker";
import { AUTH_QUERY_KEY, updateProfile } from "@/features/auth/api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/i18n/language-selector";
import { useLanguage } from "@/i18n/language-provider";

export const UserProfilePanel = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { syncFailed } = useLanguage();
    const queryClient = useQueryClient();
    const { control, handleSubmit, watch, reset, setError, formState } = useForm({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: { name: user?.name ?? "", avatarUrl: user?.avatarUrl ?? "", cover: user?.cover ?? null },
    });
    const mutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(AUTH_QUERY_KEY, updatedUser);
            reset({ name: updatedUser.name, avatarUrl: updatedUser.avatarUrl ?? "", cover: updatedUser.cover ?? null });
        },
        onError: (error) => setError("root", { message: error instanceof ApiError ? error.message : t("profile.couldNotSave") }),
    });
    const coverRef = useRef<HTMLDivElement>(null);
    if (!user) return null;
    const previewUrl = watch("avatarUrl");
    const previewCover = watch("cover");
    const initials = user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("");

    return (
        <div className="w-full">
            <div className="relative">
                <div ref={coverRef} data-profile-cover className="relative h-44 overflow-hidden rounded-lg border border-subtle bg-surface-2">
                    <CoverImage cover={previewCover} className="absolute inset-0" />
                    <div className="absolute right-3 top-3"><Controller control={control} name="cover" render={({ field }) => <CoverPicker cover={field.value} onChange={field.onChange} disabled={mutation.isPending} containerRef={coverRef} />} /></div>
                </div>
                <div data-profile-avatar className="absolute -bottom-6 left-6 rounded-lg bg-surface-1 p-1">
                    <Avatar key={previewUrl} src={previewUrl || undefined} initials={initials} size="2xl" rounded={false} className="rounded-lg" />
                    <Controller control={control} name="avatarUrl" render={({ field }) => <AvatarUrlPicker value={field.value} initials={initials} onChange={field.onChange} disabled={mutation.isPending} />} />
                </div>
            </div>
            <div className="mt-10 mb-8 space-y-1">
                <h1 className="text-base font-medium text-secondary">{user.name}</h1>
                <p className="text-sm text-tertiary">{user.email}</p>
            </div>
            <form className="space-y-6" noValidate onSubmit={handleSubmit((data) => mutation.mutate(data))}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                    <ControlledInput control={control} name="name" label={t("profile.fullName")} isRequired isDisabled={mutation.isPending} />
                    <Input label={t("profile.username")} value={user.username} isDisabled />
                    <Input label={t("profile.email")} value={user.email} isDisabled />
                </div>
                {formState.errors.root && <Alert tone="error">{formState.errors.root.message}</Alert>}
                {mutation.isSuccess && !formState.isDirty && <Alert tone="success">{t("profile.profileSaved")}</Alert>}
                <Button type="submit" size="lg" isLoading={mutation.isPending} isDisabled={!formState.isDirty}>
                    {t("common.saveChanges")}
                </Button>
            </form>
            <div className="mt-8">
                <SettingsControl title={t("common.language")} description={t("profile.languageDescription")}>
                    <LanguageSelector />
                    {syncFailed && <p role="status" className="mt-2 text-sm text-warning-primary">{t("common.languageNotSynced")}</p>}
                </SettingsControl>
            </div>
            {user.isAdmin && (
                <div className="mt-10">
                    <SettingsControl
                        title={t("profile.databaseBackup")}
                        description={t("profile.backupDescription")}
                    >
                        <Button href="/api/admin/backup" download color="secondary" size="lg" iconLeading={Download}>
                            {t("profile.downloadBackup")}
                        </Button>
                    </SettingsControl>
                </div>
            )}
        </div>
    );
};
