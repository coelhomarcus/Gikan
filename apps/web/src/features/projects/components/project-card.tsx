import { ArrowRight } from "@untitledui/icons";
import { Link } from "react-router";
import type { Project } from "../api";

export const ProjectCard = ({ project }: { project: Project }) => {
    return (
        <Link
            to={`/projects/${project.id}`}
            className="group flex flex-col gap-2 rounded-xl border border-secondary p-5 transition duration-100 ease-linear hover:border-brand hover:bg-secondary_hover"
        >
            <div className="flex items-center justify-between gap-3">
                <h3 className="truncate font-semibold text-primary">{project.name}</h3>
                <ArrowRight className="size-4 shrink-0 text-fg-quaternary transition duration-100 ease-linear group-hover:translate-x-0.5 group-hover:text-fg-quaternary_hover" />
            </div>
            {project.description && <p className="line-clamp-2 text-sm text-tertiary">{project.description}</p>}
        </Link>
    );
};
