import { zodResolver } from "@hookform/resolvers/zod";
import { type AddProjectMemberInput, addProjectMemberSchema } from "@todokanban/shared";
import { UserMinus01 } from "@untitledui/icons";
import { useForm } from "react-hook-form";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ControlledInput } from "@/components/form/controlled-input";
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
    const { data: members, isLoading } = useProjectMembers(projectId);
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
                                setError("root", { message: error instanceof ApiError ? error.message : "Não foi possível convidar" });
                            },
                        });
                    })}
                >
                    <div className="flex-1">
                        <ControlledInput control={control} name="username" label="Convidar por usuário" placeholder="username" isRequired />
                        {formState.errors.root && <p className="mt-1 text-sm text-error-primary">{formState.errors.root.message}</p>}
                    </div>
                    <Button type="submit" isLoading={addMutation.isPending}>
                        Convidar
                    </Button>
                </form>
            )}

            {isLoading && <p className="text-tertiary">Carregando...</p>}

            {members && (
                <ul className="flex flex-col gap-2">
                    {members.map((member) => (
                        <li key={member.id} className="flex items-center gap-3 rounded-lg border border-secondary px-3 py-2.5">
                            <Avatar initials={initialsOf(member.name)} size="md" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-primary">{member.name}</p>
                                <p className="truncate text-xs text-tertiary">@{member.username}</p>
                            </div>
                            <Badge color={member.role === "owner" ? "brand" : "gray"} size="sm" type="pill-color">
                                {member.role === "owner" ? "Owner" : "Membro"}
                            </Badge>
                            {isProjectOwner && member.role !== "owner" && (
                                <ButtonUtility
                                    icon={UserMinus01}
                                    size="sm"
                                    color="tertiary"
                                    tooltip="Remover"
                                    onClick={() => removeMutation.mutate(member.id)}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
