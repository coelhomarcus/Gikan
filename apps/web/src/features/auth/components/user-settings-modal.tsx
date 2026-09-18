import { updateProfileSchema } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { ControlledInput } from "@/components/form/controlled-input";
import { AUTH_QUERY_KEY, updateProfile } from "@/features/auth/api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { useTheme } from "@/providers/theme-provider";

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
    const { theme, setTheme } = useTheme();
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
            setError("root", { message: error instanceof ApiError ? error.message : "Could not save" });
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
                            <h2 className="text-lg font-semibold text-primary">Settings</h2>
                            <CloseButton size="sm" onPress={onClose} />
                        </div>
                        <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit((data) => mutation.mutate(data))}>
                            <div className="flex items-center gap-4">
                                <Avatar src={previewUrl || undefined} initials={initialsOf(user.name)} size="xl" />
                                <div className="flex-1">
                                    <ControlledInput control={control} name="avatarUrl" label="Profile photo URL" placeholder="https://..." />
                                </div>
                            </div>

                            <ControlledInput control={control} name="name" label="Name" isRequired />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-secondary">Username</p>
                                    <p className="mt-1.5 text-sm text-tertiary">@{user.username}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-secondary">Email</p>
                                    <p className="mt-1.5 truncate text-sm text-tertiary">{user.email}</p>
                                </div>
                            </div>

                            <label className="flex flex-col gap-1.5 text-sm font-medium text-secondary">
                                Appearance
                                <select
                                    value={theme}
                                    onChange={(event) => setTheme(event.target.value as typeof theme)}
                                    className="h-10 rounded-md border border-secondary bg-primary px-3 text-sm font-normal text-primary outline-none transition focus:border-brand"
                                >
                                    <option value="system">System</option>
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                </select>
                            </label>

                            {formState.errors.root && <p className="text-sm text-error-primary">{formState.errors.root.message}</p>}
                            {mutation.isSuccess && !formState.isDirty && <p className="text-sm text-success-primary">Saved!</p>}

                            <div className="flex justify-end">
                                <Button type="submit" isLoading={mutation.isPending}>
                                    Save
                                </Button>
                            </div>
                        </form>

                        {user.isAdmin && (
                            <div className="mt-6 flex flex-col gap-3 border-t border-secondary pt-5">
                                <div>
                                    <p className="text-sm font-medium text-secondary">Administration</p>
                                    <p className="mt-1 text-sm text-tertiary">
                                        Download a file with all database data (projects, issues, columns, categories, members, and users), useful for restoring
                                        the platform if the database needs to be recreated from scratch.
                                    </p>
                                </div>
                                <Button href="/api/admin/backup" download color="secondary" size="sm" iconLeading={Download} className="w-fit">
                                    Download database backup
                                </Button>
                            </div>
                        )}
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
