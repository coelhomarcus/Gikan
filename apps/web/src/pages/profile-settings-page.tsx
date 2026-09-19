import { Topbar } from "@/components/layout/topbar";
import { UserProfilePanel } from "@/features/auth/components/user-profile-panel";

export function ProfileSettingsPage() {
    return (
        <div className="flex h-full min-h-0 flex-col">
            <Topbar title="Account settings / General" />
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="w-full px-6 py-9 md:px-8">
                    <UserProfilePanel />
                </div>
            </div>
        </div>
    );
}
