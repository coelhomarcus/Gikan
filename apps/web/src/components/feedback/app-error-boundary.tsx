import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/base/buttons/button";

interface AppErrorBoundaryProps {
    children: ReactNode;
}

interface AppErrorBoundaryState {
    hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
    state: AppErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): AppErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(_error: Error, _info: ErrorInfo) {
        // Keep the boundary quiet in production. The host can report errors through its own instrumentation.
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <main className="flex min-h-dvh items-center justify-center bg-primary px-5 py-12 text-primary sm:px-8">
                <section className="w-full max-w-md rounded-2xl border border-secondary bg-secondary_alt/40 p-6 shadow-2xl sm:p-8" role="alert">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-error-primary/10 text-fg-error-primary">
                        <AlertTriangle className="size-5" aria-hidden="true" />
                    </div>
                    <h1 className="mt-5 text-display-xs font-semibold tracking-tight">Something went wrong</h1>
                    <p className="mt-2 text-sm leading-relaxed text-tertiary">Gikan could not render this screen. Reload the page or return to your projects.</p>
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
                        <Button color="secondary" size="md" href="/">
                            Go to projects
                        </Button>
                        <Button size="md" iconLeading={RefreshCw} onClick={() => window.location.reload()}>
                            Reload page
                        </Button>
                    </div>
                </section>
            </main>
        );
    }
}
