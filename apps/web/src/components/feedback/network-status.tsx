import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export const NetworkStatus = () => {
    const [isOffline, setIsOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed inset-x-0 bottom-3 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-fg-warning-primary/40 bg-primary px-3 py-2 text-xs font-medium text-secondary shadow-xl" role="status" aria-live="polite">
            <WifiOff className="size-3.5 shrink-0 text-fg-warning-primary" aria-hidden="true" />
            <span>You're offline. Changes may not save until you're back online.</span>
        </div>
    );
};
