import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import type { ProjectSummary } from "../api";
import { ProjectIcon } from "./project-icon";

export const ProjectCard = ({ project }: { project: ProjectSummary }) => {
    const updatedAt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(project.updatedAt));

    return (
        <Link
            to={`/projects/${project.id}`}
            data-project-context="true"
            data-project-id={project.id}
            className="group flex min-w-0 items-center gap-3 px-3 py-3.5 transition duration-100 ease-linear hover:bg-secondary"
        >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-primary_alt text-fg-brand-primary">
                <ProjectIcon icon={project.icon} className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-sm font-medium text-primary">{project.name}</span>
                    <span className="shrink-0 font-mono text-xs text-tertiary">{project.issueKey}</span>
                </span>
                <span className="mt-0.5 block truncate text-sm text-tertiary">{project.description || "No description"}</span>
            </span>
            <span className="hidden shrink-0 text-xs text-tertiary sm:block">Updated {updatedAt}</span>
            <ArrowRight className="size-4 shrink-0 text-fg-quaternary transition duration-100 ease-linear group-hover:translate-x-0.5 group-hover:text-fg-brand-primary" aria-hidden="true" />
        </Link>
    );
};
