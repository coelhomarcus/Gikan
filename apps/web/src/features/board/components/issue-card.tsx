import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "@/components/base/avatar/avatar";
import { CategoryBadge } from "@/features/categories/components/category-badge";
import type { Issue, IssuePerson } from "@/features/issues/api";
import { cx } from "@/utils/cx";
import { ImportanceBadge } from "./importance-badge";

function initialsOf(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join("");
}

interface IssueCardContentProps {
    issue: Issue;
    category?: { name: string; color: string | null };
    assignee?: IssuePerson;
}

/** Pure visual issue content reused by the sortable card and drag overlay. */
export const IssueCardContent = ({ issue, category, assignee }: IssueCardContentProps) => (
    <>
        <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-fg-brand-primary">{issue.identifier}</span>
            {issue.estimate && <span className="text-[11px] text-tertiary">{issue.estimate} pts</span>}
        </div>
        <p className="text-sm font-medium text-primary">{issue.title}</p>

        {(category || issue.priority) && (
            <div className="flex flex-wrap items-center gap-2">
                {category && <CategoryBadge category={category} />}
                <ImportanceBadge importance={issue.priority} />
            </div>
        )}

        {assignee && (
            <div className="flex items-center gap-2">
                <Avatar src={assignee.avatarUrl ?? undefined} initials={initialsOf(assignee.name)} size="xs" />
                <span className="text-xs text-tertiary">{assignee.name}</span>
            </div>
        )}
    </>
);

interface IssueCardProps extends IssueCardContentProps {
    projectId: string;
    onClick: () => void;
}

export const IssueCard = ({ issue, category, assignee, projectId, onClick }: IssueCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id });

    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onClick();
                }
            }}
            role="button"
            tabIndex={0}
            data-issue-id={issue.id}
            data-issue-context="true"
            data-project-id={projectId}
            data-issue-identifier={issue.identifier}
            data-issue-title={issue.title}
            className={cx(
                "flex cursor-pointer touch-none flex-col gap-2 rounded-md border border-secondary bg-primary p-3 transition duration-100 ease-linear hover:border-brand hover:bg-primary_hover",
                isDragging && "z-10 opacity-50",
            )}
        >
            <IssueCardContent issue={issue} category={category} assignee={assignee} />
        </div>
    );
};
