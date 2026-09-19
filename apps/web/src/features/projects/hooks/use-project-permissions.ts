import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProjectMembers } from "./use-project-members";

export function useProjectPermissions(projectId: string) {
    const { user } = useAuth();
    const { data: members, isLoading, isError } = useProjectMembers(projectId);
    return { isProjectOwner: !!(user?.isAdmin || members?.some((member) => member.id === user?.id && member.role === "owner")), isLoading, isError };
}
