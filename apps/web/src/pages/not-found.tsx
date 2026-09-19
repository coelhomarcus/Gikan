import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";

export function NotFound() {
    const router = useNavigate();

    return (
        <section className="flex min-h-dvh items-center justify-center bg-surface-1 px-4 py-12 sm:px-6">
            <div className="w-full max-w-md rounded-xl border border-subtle bg-surface-2/40 p-6 shadow-2xl sm:p-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <span className="font-mono text-xs uppercase tracking-[0.16em] text-accent-primary">404 · Not found</span>
                        <h1 className="text-display-xs font-semibold tracking-tight text-primary">This page is missing.</h1>
                        <p className="text-sm leading-relaxed text-tertiary">The link may be outdated, or the page may have moved somewhere else.</p>
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button color="secondary" size="md" iconLeading={ArrowLeft} onClick={() => router(-1)}>
                            Go back
                        </Button>
                        <Button size="md" onClick={() => router("/")}>
                            Go home
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
