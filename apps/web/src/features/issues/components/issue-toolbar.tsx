import { Popover } from "@base-ui/react/popover";
import { AddOutline, CloseOutline, DisplayOutline, FilterOutline, SearchOutline } from "@makeplane/propel/icons";
import { useSearchParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { useColumns } from "@/features/board/hooks/use-board";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { useCycles } from "../hooks/use-issues";
import { readIssueOrder } from "../lib/issue-filters";

export function IssueToolbar({ projectId, onCreate, layout = "list", compact = false }: { projectId: string; onCreate: () => void; layout?: "list" | "board"; compact?: boolean }) {
    const [query, setQuery] = useSearchParams();
    const { data: columns } = useColumns(projectId);
    const { data: categories } = useCategories(projectId);
    const { data: members } = useProjectMembers(projectId);
    const { data: cycles } = useCycles(projectId);
    function update(key: string, value: string) {
        setQuery(
            (current) => {
                const next = new URLSearchParams(current);
                if (value) next.set(key, value);
                else next.delete(key);
                return next;
            },
            { replace: true },
        );
    }
    const filters = [
        { key: "status", label: "Status", items: columns ?? [] },
        { key: "priority", label: "Priority", items: ["high", "medium", "low"].map((id) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) })) },
        { key: "assignee", label: "Assignee", items: members ?? [] },
        { key: "label", label: "Label", items: categories ?? [] },
        { key: "cycle", label: "Cycle", items: cycles ?? [] },
    ];
    const count = filters.filter((filter) => query.get(filter.key)).length;
    const popup = "grid w-[min(320px,calc(100vw-32px))] gap-3 rounded-md border border-subtle bg-layer-2 p-3 shadow-overlay-200 outline-none";
    return (
        <div className={compact ? "board-toolbar min-w-0" : "shrink-0 border-b border-subtle"}>
            <div className={compact ? "flex items-center gap-2" : "flex min-h-11 flex-wrap items-center gap-2 px-4 py-2"}>
                <Popover.Root>
                    <Popover.Trigger render={<Button aria-label="Filters" color={compact ? "secondary" : "tertiary"} iconLeading={FilterOutline} />}>{compact ? "" : "Filters"}{count ? ` · ${count}` : ""}</Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Positioner sideOffset={8} align="start" className="z-30">
                            <Popover.Popup className={popup}>
                                <Popover.Title className="text-sm font-medium">Filter issues</Popover.Title>
                                {filters.map((filter) => (
                                    <Select
                                        key={filter.key}
                                        label={filter.label}
                                        size="sm"
                                        selectedKey={query.get(filter.key) ?? ""}
                                        onSelectionChange={(value) => update(filter.key, String(value ?? ""))}
                                        items={[{ id: "", label: "All" }, ...filter.items.map((item) => ({ id: item.id, label: item.name }))]}
                                    >
                                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                    </Select>
                                ))}
                            </Popover.Popup>
                        </Popover.Positioner>
                    </Popover.Portal>
                </Popover.Root>
                {compact ? <Popover.Root>
                    <Popover.Trigger render={<Button aria-label="Search issues" color="tertiary" iconLeading={SearchOutline} />} />
                    <Popover.Portal><Popover.Positioner sideOffset={8} align="end" className="z-30"><Popover.Popup className={popup}>
                        <Popover.Title className="sr-only">Search issues</Popover.Title>
                        <Input size="sm" value={query.get("q") ?? ""} onChange={(value) => update("q", value)} placeholder="Search issues" icon={SearchOutline} />
                    </Popover.Popup></Popover.Positioner></Popover.Portal>
                </Popover.Root> : (<div className="w-40">
                    <Input
                        size="sm"
                        value={query.get("q") ?? ""}
                        onChange={(value) => update("q", value)}
                        placeholder="Search issues"
                        icon={SearchOutline}
                        wrapperClassName="bg-transparent ring-0 shadow-none focus-within:ring-1"
                    />
                </div>)}
                <div className="ml-auto flex items-center gap-2">
                    <Popover.Root>
                        <Popover.Trigger render={<Button color={compact ? "secondary" : "tertiary"} iconLeading={compact ? undefined : DisplayOutline} />}>Display</Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Positioner sideOffset={8} align="end" className="z-30">
                                <Popover.Popup className={popup}>
                                    <Popover.Title className="text-sm font-medium">Display options</Popover.Title>
                                    <Select
                                        label="Order by"
                                        size="sm"
                                        selectedKey={readIssueOrder(query.get("order"))}
                                        onSelectionChange={(value) => update("order", String(value ?? "position"))}
                                        items={[
                                            { id: "position", label: "Manual order" },
                                            { id: "priority", label: "Priority" },
                                            { id: "updated", label: "Recently updated" },
                                            { id: "number", label: "Issue number" },
                                        ]}
                                    >
                                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                    </Select>
                                    {layout === "list" && (
                                        <Select
                                            label="Group by"
                                            size="sm"
                                            selectedKey={query.get("group") ?? "none"}
                                            onSelectionChange={(value) => update("group", value === "none" ? "" : String(value))}
                                            items={[
                                                { id: "none", label: "No grouping" },
                                                { id: "status", label: "Status" },
                                                { id: "assignee", label: "Assignee" },
                                                { id: "cycle", label: "Cycle" },
                                            ]}
                                        >
                                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                        </Select>
                                    )}
                                </Popover.Popup>
                            </Popover.Positioner>
                        </Popover.Portal>
                    </Popover.Root>
                    <Button iconLeading={compact ? undefined : AddOutline} onClick={onCreate}>
                        New issue
                    </Button>
                </div>
            </div>
            {count > 0 && (
                <div className={compact ? "absolute top-full right-0 z-10 flex flex-wrap gap-2 border border-subtle bg-surface-1 p-2" : "flex flex-wrap gap-2 border-t border-subtle px-4 py-2"}>
                    {filters
                        .filter((filter) => query.get(filter.key))
                        .map((filter) => (
                            <button
                                key={filter.key}
                                onClick={() => update(filter.key, "")}
                                className="flex items-center gap-1 rounded border border-subtle bg-layer-1 px-2 py-0.5 text-xs text-secondary"
                                aria-label={`Clear ${filter.label} filter`}
                            >
                                {filter.label}: {filter.items.find((item) => item.id === query.get(filter.key))?.name ?? "Selected"}
                                <CloseOutline className="size-3" />
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}
