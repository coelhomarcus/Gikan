import type { ReactNode } from "react";

/** Geometry and typography: Plane 01064a7 settings/{heading,boxed-control-item}. */
export function SettingsHeading({ title, description, control }: { title: string; description?: string; control?: ReactNode }) {
    return (
        <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-col gap-1">
                <h1 className="text-h3-medium text-primary">{title}</h1>
                {description && <p className="text-body-xs-regular text-tertiary">{description}</p>}
            </div>
            {control}
        </header>
    );
}

export function SettingsControl({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4 rounded-lg border border-subtle bg-layer-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="min-w-0 space-y-1.5">
                <h2 className="text-body-sm-medium text-primary">{title}</h2>
                <p className="text-caption-md-regular text-tertiary">{description}</p>
            </div>
            <div className="shrink-0">{children}</div>
        </section>
    );
}
