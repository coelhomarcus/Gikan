import { Skeleton } from "@/components/base/feedback/skeleton";

/** Keeps the workspace frame mounted while a lazy route's content is loaded. */
export function WorkspaceLoadingFallback() {
    return (
        <div className="flex min-h-0 flex-1 flex-col" role="status" aria-label="Loading page" aria-live="polite">
            <div className="flex h-12 shrink-0 items-center border-b border-subtle px-4">
                <Skeleton className="h-4 w-48" />
            </div>
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 overflow-hidden px-4 py-6 lg:px-8 lg:py-8">
                <div className="space-y-3 border-b border-subtle pb-6">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-7 w-64 max-w-full" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                </div>
                <Skeleton className="h-36 w-full rounded-lg" />
                <Skeleton className="h-36 w-full rounded-lg" />
            </div>
        </div>
    );
}
