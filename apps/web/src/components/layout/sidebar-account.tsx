import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut01, Settings01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { Avatar } from "@/components/base/avatar/avatar";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { AUTH_QUERY_KEY, logout } from "@/features/auth/api";
import { UserSettingsModal } from "@/features/auth/components/user-settings-modal";
import { useAuth } from "@/features/auth/hooks/use-auth";

function initialsOf(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join("");
}

export const SidebarAccount = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const mutation = useMutation({
        mutationFn: logout,
        onSuccess: () => {
            queryClient.setQueryData(AUTH_QUERY_KEY, null);
            navigate("/login", { replace: true });
        },
    });

    if (!user) {
        return null;
    }

    return (
        <div className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset">
            <Avatar src={user.avatarUrl ?? undefined} initials={initialsOf(user.name)} size="md" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary">{user.name}</p>
                <p className="truncate text-xs text-tertiary">@{user.username}</p>
            </div>
            <ButtonUtility icon={Settings01} size="sm" color="tertiary" tooltip="Configurações" onClick={() => setIsSettingsOpen(true)} />
            <ButtonUtility icon={LogOut01} size="sm" color="tertiary" tooltip="Sair" onClick={() => mutation.mutate()} />
            {isSettingsOpen && <UserSettingsModal onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
};
