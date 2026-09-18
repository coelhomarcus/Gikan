import { type AddProjectMemberInput, addProjectMemberSchema } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserMinus01 } from "@untitledui/icons";
import { useForm } from "react-hook-form";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ErrorMessage } from "@/components/feedback/error-message";
import { ControlledInput } from "@/components/form/controlled-input";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import { ApiError } from "@/lib/api-client";
import { useAddProjectMember, useProjectMembers, useRemoveProjectMember } from "../hooks/use-project-members";

function initialsOf(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join("");
}

interface MembersPanelProps {
    projectId: string;
    isProjectOwner: boolean;
}

export const MembersPanel = ({ projectId, isProjectOwner }: MembersPanelProps) => {
    const { data: members, isLoading, isError } = useProjectMembers(projectId);
    const addMutation = useAddProjectMember(projectId);
    const removeMutation = useRemoveProjectMember(projectId);

    const { control, handleSubmit, reset, setError, formState } = useForm<AddProjectMemberInput>({
        resolver: zodResolver(addProjectMemberSchema),
        defaultValues: { username: "" },
    });

    return (
        <div className="flex flex-col gap-6">
            {isProjectOwner && (
                <form
                    className="flex items-end gap-4 rounded-xl border border-secondary p-4"
                    noValidate
                    onSubmit={handleSubmit((data) => {
                        addMutation.mutate(data.username, {
                            onSuccess: () => reset(),
                            onError: (error) => {
                                setError("root", { message: error instanceof ApiError ? error.message : "Could not invite the member" });
                            },
                        });
                    })}
                >
                    <div className="flex-1">
                        <ControlledInput control={control} name="username" label="Invite by username" placeholder="username" isRequired />
                        {formState.errors.root && <p className="mt-1 text-sm text-error-primary">{formState.errors.root.message}</p>}
                    </div>
                    <Button type="submit" isLoading={addMutation.isPending}>
                        Invite
                    </Button>
                </form>
            )}

            {isLoading && <p className="text-tertiary">Loading...</p>}
            {isError && <ErrorMessage message="Could not load the project members." />}

            {members && (
                <ul className="flex flex-col gap-2">
                    {members.map((member) => (
                        <li key={member.id} className="flex items-center gap-3 rounded-lg border border-secondary px-3 py-2.5">
                            <Avatar src={member.avatarUrl ?? undefined} initials={initialsOf(member.name)} size="md" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-primary">{member.name}</p>
                                <p className="truncate text-xs text-tertiary">@{member.username}</p>
                            </div>
                            <Badge color={member.role === "owner" ? "brand" : "gray"} size="sm" type="pill-color">
                                {member.role === "owner" ? "Owner" : "Member"}
                            </Badge>
                            {isProjectOwner && member.role !== "owner" && (
                                <ConfirmDialog
                                    trigger={<ButtonUtility icon={UserMinus01} size="sm" color="tertiary" tooltip="Remove" />}
                                    title="Remove member"
                                    description={`${member.name} (@${member.username}) will lose access to this project. You can invite them again later.`}
                                    confirmLabel="Remove member"
                                    isPending={removeMutation.isPending}
                                    onConfirm={() => removeMutation.mutate(member.id)}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
