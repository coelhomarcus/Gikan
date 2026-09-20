import { useState } from "react";
import { type AddProjectMemberInput, addProjectMemberSchema } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddOutline as Plus, SearchOutline as Search, UserMinusOutline as UserRoundMinus } from "@makeplane/propel/icons";
import { useForm } from "react-hook-form";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Alert } from "@/components/base/feedback/alert";
import { Input } from "@/components/base/input/input";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { ControlledInput } from "@/components/form/controlled-input";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import { ModalDialog } from "@/components/overlay/modal-dialog";
import { ApiError } from "@/lib/api-client";
import { useAddProjectMember, useProjectMembers, useRemoveProjectMember } from "../hooks/use-project-members";
import { useTranslation } from "react-i18next";

export const MembersPanel = ({ projectId, isProjectOwner }: { projectId: string; isProjectOwner: boolean }) => {
    const { t, i18n } = useTranslation();
    const { data: members, isLoading, isError } = useProjectMembers(projectId);
    const removeMutation = useRemoveProjectMember(projectId);
    const [search, setSearch] = useState("");
    const filtered = members?.filter((member) => `${member.name} ${member.username} ${member.email}`.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <div>
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-subtle py-2">
                <h1 className="text-sm font-semibold text-primary">{t("settings.members")}</h1>
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        size="sm"
                        aria-label={t("settings.searchMembers")}
                        placeholder={t("settings.searchMembers")}
                        icon={Search}
                        value={search}
                        onChange={setSearch}
                        className="w-56 max-w-full"
                    />
                    {isProjectOwner && (
                        <ModalDialog
                            trigger={
                                <Button size="lg" iconLeading={Plus}>
                                    {t("settings.addMember")}
                                </Button>
                            }
                            title={t("settings.addMember")}
                            description={t("settings.addMemberDescription")}
                        >
                            {({ close }) => <AddMemberForm projectId={projectId} onClose={close} />}
                        </ModalDialog>
                    )}
                </div>
            </header>
            {removeMutation.isError && (
                <div className="mt-4">
                    <Alert tone="error">{removeMutation.error instanceof ApiError ? removeMutation.error.message : t("settings.couldNotRemoveMember")}</Alert>
                </div>
            )}
            {isLoading && <LoadingState label={t("settings.loadingMembers")} />}
            {isError && <ErrorMessage message={t("settings.couldNotLoadMembers")} />}
            {filtered && filtered.length === 0 && (
                <EmptyState
                    title={search.trim() ? t("settings.noMembersFound") : t("settings.noMembers")}
                    description={search.trim() ? t("settings.tryMemberSearch") : t("settings.inviteTeammates")}
                />
            )}
            {!!filtered?.length && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-secondary">
                        <thead>
                            <tr className="border-b border-subtle text-xs text-tertiary">
                                <th scope="col" className="min-w-56 px-3 py-3 font-medium">
                                    {t("settings.name")}
                                </th>
                                <th scope="col" className="px-3 py-3 font-medium">
                                    {t("settings.email")}
                                </th>
                                <th scope="col" className="px-3 py-3 font-medium">
                                    {t("settings.role")}
                                </th>
                                <th scope="col" className="px-3 py-3 font-medium whitespace-nowrap">
                                    {t("settings.joinedOn")}
                                </th>
                                {isProjectOwner && (
                                    <th scope="col" className="w-10">
                                        <span className="sr-only">{t("settings.actions")}</span>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-subtle">
                            {filtered.map((member) => (
                                <tr key={member.id} className="group hover:bg-layer-transparent-hover">
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <Avatar
                                                src={member.avatarUrl ?? undefined}
                                                initials={member.name
                                                    .split(" ")
                                                    .filter(Boolean)
                                                    .slice(0, 2)
                                                    .map((part) => part[0])
                                                    .join("")}
                                                size="xs"
                                            />
                                            <span className="max-w-64 truncate">{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-tertiary">{member.email}</td>
                                    <td className="px-3 py-3">{member.role === "owner" ? t("settings.owner") : t("settings.member")}</td>
                                    <td className="px-3 py-3 whitespace-nowrap text-tertiary">
                                        {new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(member.joinedAt))}
                                    </td>
                                    {isProjectOwner && (
                                        <td className="px-2 py-3">
                                            {member.role !== "owner" && (
                                                <div className="opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 md:opacity-0">
                                                    <ConfirmDialog
                                                        trigger={
                                                            <ButtonUtility
                                                                icon={UserRoundMinus}
                                                                size="sm"
                                                                color="tertiary"
                                                                tooltip={`${t("settings.removeMember")} ${member.name}`}
                                                                isDisabled={removeMutation.isPending}
                                                            />
                                                        }
                                                        title={t("settings.removeMember")}
                                                        description={t("settings.removeMemberDescription", { name: member.name, username: member.username })}
                                                        confirmLabel={t("settings.removeMember")}
                                                        isPending={removeMutation.isPending}
                                                        onConfirm={() => removeMutation.mutate(member.id)}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

function AddMemberForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
    const { t } = useTranslation();
    const mutation = useAddProjectMember(projectId);
    const { control, handleSubmit, setError, formState } = useForm<AddProjectMemberInput>({
        resolver: zodResolver(addProjectMemberSchema),
        defaultValues: { username: "" },
    });
    return (
        <form
            className="space-y-5"
            noValidate
            onSubmit={handleSubmit((data) =>
                mutation.mutate(data.username, {
                    onSuccess: onClose,
                    onError: (error) => setError("root", { message: error instanceof ApiError ? error.message : t("settings.couldNotAddMember") }),
                }),
            )}
        >
            <ControlledInput control={control} name="username" label={t("settings.username")} placeholder={t("settings.username")} isRequired autoFocus isDisabled={mutation.isPending} />
            {formState.errors.root && <Alert tone="error">{formState.errors.root.message}</Alert>}
            <div className="flex justify-end gap-2">
                <Button color="secondary" size="lg" isDisabled={mutation.isPending} onClick={onClose}>
                    {t("common.cancel")}
                </Button>
                <Button type="submit" size="lg" isLoading={mutation.isPending}>
                    {t("settings.addMember")}
                </Button>
            </div>
        </form>
    );
}
