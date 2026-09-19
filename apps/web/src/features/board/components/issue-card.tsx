import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocation } from "react-router";
import { AssigneeOutline, EstimateOutline } from "@makeplane/propel/icons";
import type { Issue, IssuePerson } from "@/features/issues/api";
import { cx } from "@/utils/cx";
import { CycleIcon, IssueAvatar, PriorityIcon, StateIcon } from "./issue-property-icons";

interface IssueCardContentProps {
    issue: Issue;
    category?: { name: string; color: string | null };
    assignee?: IssuePerson;
    column?: { name: string; color: string | null };
    cycle?: { name: string };
}

const chip = "inline-flex h-5 max-w-full items-center gap-1.5 rounded-sm border border-strong px-1.5 text-body-xs-regular text-secondary";

/** Shared with the drag overlay so picking up an issue preserves its geometry. */
export const IssueCardContent = ({ issue, category, assignee, column, cycle }: IssueCardContentProps) => (
    <>
        <span className="block text-caption-sm-regular font-medium text-tertiary">{issue.identifier}</span>
        <p className="mt-2 line-clamp-1 text-body-sm-medium text-primary" title={issue.title}>{issue.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 pt-1.5 text-tertiary">
            {column && <span className={chip}><StateIcon name={column.name} color={column.color} /><span className="truncate">{column.name}</span></span>}
            <PriorityIcon priority={issue.priority} withContainer />
            {assignee ? <IssueAvatar name={assignee.name} avatarUrl={assignee.avatarUrl} /> : <span className={chip} title="Unassigned"><AssigneeOutline className="size-3" /></span>}
            {issue.estimate != null && <span className={chip} title={`${issue.estimate} points`}><EstimateOutline className="size-3" />{issue.estimate}</span>}
            {cycle && <span className={chip}><CycleIcon className="size-3" /><span className="truncate">{cycle.name}</span></span>}
            {category && <span className={chip}><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: category.color ?? "#7a5af8" }} />{category.name}</span>}
        </div>
    </>
);

interface IssueCardProps extends IssueCardContentProps {
    projectId: string;
    onClick: () => void;
}

export const IssueCard = ({ issue, category, assignee, column, cycle, projectId, onClick }: IssueCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id });

    const location = useLocation();
    const selected = location.pathname.endsWith(`/issues/${issue.identifier}`);
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    onClick();
                } else listeners?.onKeyDown?.(event);
            }}
            role="button"
            tabIndex={0}
            data-issue-id={issue.id}
            data-issue-context="true"
            data-project-id={projectId}
            data-issue-identifier={issue.identifier}
            data-issue-title={issue.title}
            className={cx(
                "mb-3 block cursor-pointer touch-none rounded-lg border border-subtle bg-layer-2 p-3 shadow-raised-100 outline-none transition duration-100 ease-linear hover:border-strong hover:shadow-raised-200 focus-visible:ring-1 focus-visible:ring-accent-strong",
                selected && "border-accent-strong",
                isDragging && "z-10 opacity-50",
            )}
        >
            <IssueCardContent issue={issue} category={category} assignee={assignee} column={column} cycle={cycle} />
        </div>
    );
};
