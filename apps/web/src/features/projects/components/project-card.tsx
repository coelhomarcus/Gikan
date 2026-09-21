import { Settings } from "lucide-react";
import { Link } from "react-router";
import { Avatar } from "@/components/base/avatar/avatar";
import { CoverImage } from "@/components/appearance/cover-image";
import { ContextMenuButton } from "@/components/overlay/context-menu-provider";
import type { ProjectCardSummary } from "../api";
import { ProjectIcon } from "./project-icon";
import { useTranslation } from "react-i18next";

export const ProjectCard = ({ project }: { project: ProjectCardSummary }) => {
    const { t, i18n } = useTranslation();
    const date = new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric" }).format(new Date(project.createdAt));
    const memberPreview = project.memberPreview ?? [];
    const memberCount = project.memberCount ?? memberPreview.length;
    const hiddenMembers = Math.max(0, memberCount - memberPreview.length);
    return (
        <article
            className="group/project-card relative flex h-[222px] min-w-0 flex-col overflow-hidden rounded-lg border border-subtle bg-layer-2 transition duration-300 hover:border-strong hover:shadow-raised-200"
            data-project-context="true"
            data-project-id={project.id}
            data-project-name={project.name}
            data-project-issue-key={project.issueKey}
        >
            <Link to={`/projects/${project.id}`} className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset">
                <div className="relative h-[118px] shrink-0">
                    <CoverImage cover={project.cover} alt="" className="absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute inset-x-0 bottom-4 flex h-10 items-center gap-3 px-4">
                        <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-white/10 text-white">
                            <ProjectIcon icon={project.iconAppearance ?? project.icon} className="size-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-white">{project.name}</span>
                            <span className="mt-0.5 block font-mono text-[11px] font-medium text-white">{project.issueKey}</span>
                        </span>
                    </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col justify-between p-4">
                    <p className="line-clamp-2 text-[13px] text-tertiary">{project.description?.trim() || t("projects.createdOn", { date })}</p>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 -space-x-1.5">
                            {memberPreview.map((member) => (
                                <Avatar key={member.id} src={member.avatarUrl ?? undefined} initials={member.name.slice(0, 2).toUpperCase()} size="xs" className="ring-2 ring-layer-2" />
                            ))}
                            {hiddenMembers > 0 && <span className="grid size-5 place-items-center rounded-full bg-surface-2 text-[10px] text-tertiary ring-2 ring-layer-2">+{hiddenMembers}</span>}
                            {memberCount === 0 && <span className="text-[13px] italic text-placeholder">{t("projects.noMembers")}</span>}
                        </div>
                        <Settings className="size-3.5 text-placeholder transition group-hover/project-card:text-secondary" aria-hidden="true" />
                    </div>
                </div>
            </Link>
            <ContextMenuButton entity={{ type: "project", projectId: project.id, name: project.name, issueKey: project.issueKey }} className="absolute right-2 bottom-2 opacity-100 md:opacity-0 md:group-hover/project-card:opacity-100 md:group-focus-within/project-card:opacity-100" />
        </article>
    );
};
