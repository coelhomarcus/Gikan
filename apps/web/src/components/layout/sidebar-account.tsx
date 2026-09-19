import { Menu } from "@base-ui/react/menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Avatar } from "@/components/base/avatar/avatar";
import { AppIcons } from "@/components/foundations/icons";
import { AUTH_QUERY_KEY, logout } from "@/features/auth/api";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function SidebarAccount() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const mutation = useMutation({
        mutationFn: logout,
        onSuccess: () => {
            queryClient.setQueryData(AUTH_QUERY_KEY, null);
            queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== AUTH_QUERY_KEY[0] });
            navigate("/login", { replace: true });
        },
    });
    if (!user) return null;
    const item = "flex min-h-7 cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-secondary outline-none data-highlighted:bg-layer-2-hover";
    return (
        <Menu.Root>
            <Menu.Trigger aria-label="Account menu" className="flex size-8 items-center justify-center rounded-md hover:bg-layer-1">
                <Avatar
                    src={user.avatarUrl ?? undefined}
                    initials={user.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    size="xs"
                />
            </Menu.Trigger>
            <Menu.Portal>
                <Menu.Positioner align="end" sideOffset={6} className="z-50">
                    <Menu.Popup className="w-60 rounded-md border border-subtle bg-layer-2 p-1 shadow-overlay-200 outline-none">
                        <div className="border-b border-subtle px-2 py-2">
                            <p className="truncate text-sm font-medium text-primary">{user.name}</p>
                            <p className="truncate text-xs text-tertiary">{user.email}</p>
                        </div>
                        <Menu.Item className={`${item} mt-1`} onClick={() => navigate("/settings/profile")}>
                            <AppIcons.Settings className="size-4" />
                            Settings
                        </Menu.Item>
                        <Menu.Item className={item} disabled={mutation.isPending} onClick={() => mutation.mutate()}>
                            <AppIcons.SignOut className="size-4" />
                            Sign out
                        </Menu.Item>
                        {mutation.isError && (
                            <p role="alert" className="px-2 py-1 text-xs text-danger-primary">
                                Could not sign out. Try again.
                            </p>
                        )}
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
}
