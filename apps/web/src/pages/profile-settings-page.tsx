import { Topbar } from "@/components/layout/topbar";
import { UserProfilePanel } from "@/features/auth/components/user-profile-panel";

export function ProfileSettingsPage() {
    return (
        <div className="flex h-full min-h-0 flex-col">
            <Topbar title="Settings / Profile" />
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-4xl px-6 py-8 md:px-10">
                    <UserProfilePanel />
                </div>
            </div>
        </div>
    );
}
