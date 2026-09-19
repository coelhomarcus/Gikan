import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Cycle } from "@/features/issues/api";
import { useCreateCycle, useCycles, useDeleteCycle, useUpdateCycle } from "@/features/issues/hooks/use-issues";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Alert } from "@/components/base/feedback/alert";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import { ApiError } from "@/lib/api-client";

interface CyclesPanelProps {
    projectId: string;
    isProjectOwner: boolean;
}

const statusLabels: Record<Cycle["status"], string> = { planned: "Planned", active: "Active", completed: "Completed" };

export const CyclesPanel = ({ projectId, isProjectOwner }: CyclesPanelProps) => {
    const { data: cycles, isLoading, isError } = useCycles(projectId);
    const createCycle = useCreateCycle(projectId);
    const updateCycle = useUpdateCycle(projectId);
    const deleteCycle = useDeleteCycle(projectId);
    const [name, setName] = useState("");
    const [status, setStatus] = useState<Cycle["status"]>("planned");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [error, setError] = useState<string | null>(null);

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!name.trim()) {
            setError("Add a cycle name.");
            return;
        }
        setError(null);
        createCycle.mutate(
            { name: name.trim(), status, startsAt: toIso(startsAt), endsAt: toIso(endsAt) },
            {
                onSuccess: () => {
                    setName("");
                    setStatus("planned");
                    setStartsAt("");
                    setEndsAt("");
                },
                onError: (reason) => setError(reason instanceof ApiError ? reason.message : "Could not create the cycle."),
            },
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {isProjectOwner && (
                <form className="flex flex-col gap-4 rounded-lg border border-secondary p-4" onSubmit={submit}>
                    <div>
                        <h3 className="text-sm font-semibold text-primary">New cycle</h3>
                        <p className="mt-1 text-sm text-tertiary">Plan a focused period of work for this project.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
                        <Input label="Name" value={name} onChange={setName} placeholder="Cycle name" />
                        <Select
                            label="Status"
                            size="md"
                            items={Object.entries(statusLabels).map(([value, label]) => ({ id: value, label }))}
                            selectedKey={status}
                            onSelectionChange={(next) => setStatus((next ?? "planned") as Cycle["status"])}
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Input type="datetime-local" label="Starts" value={startsAt} onChange={setStartsAt} />
                        <Input type="datetime-local" label="Ends" value={endsAt} onChange={setEndsAt} />
                    </div>
                    {error && <Alert tone="error">{error}</Alert>}
                    <div><Button type="submit" isLoading={createCycle.isPending}>Create cycle</Button></div>
                </form>
            )}

            {isLoading && <LoadingState label="Loading cycles..." />}
            {isError && <ErrorMessage message="Could not load the project cycles." />}
            {!isLoading && !isError && cycles?.length === 0 && <EmptyState title="No cycles yet" description={isProjectOwner ? "Create a cycle to organize a focused period of work." : "This project does not have any cycles yet."} />}
            {!isLoading && !isError && cycles && cycles.length > 0 && (
                <div className="divide-y divide-secondary overflow-hidden rounded-lg border border-secondary">
                    {cycles.map((cycle) => (
                        <CycleRow
                            key={cycle.id}
                            cycle={cycle}
                            isProjectOwner={isProjectOwner}
                            isPending={updateCycle.isPending || deleteCycle.isPending}
                            onUpdate={(input) =>
                                updateCycle.mutate(
                                    { cycleId: cycle.id, input },
                                    { onError: (reason) => setError(reason instanceof ApiError ? reason.message : "Could not update the cycle.") },
                                )
                            }
                            onStatusChange={(nextStatus) =>
                                updateCycle.mutate(
                                    { cycleId: cycle.id, input: { status: nextStatus } },
                                    { onError: (reason) => setError(reason instanceof ApiError ? reason.message : "Could not update the cycle.") },
                                )
                            }
                            onDelete={() =>
                                deleteCycle.mutate(cycle.id, {
                                    onError: (reason) => setError(reason instanceof ApiError ? reason.message : "Could not delete the cycle."),
                                })
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

function CycleRow({ cycle, isProjectOwner, isPending, onUpdate, onStatusChange, onDelete }: { cycle: Cycle; isProjectOwner: boolean; isPending: boolean; onUpdate: (input: { name?: string; status?: Cycle["status"]; startsAt?: string | null; endsAt?: string | null }) => void; onStatusChange: (status: Cycle["status"]) => void; onDelete: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(cycle.name);
    const [startsAt, setStartsAt] = useState(toLocalInput(cycle.startsAt));
    const [endsAt, setEndsAt] = useState(toLocalInput(cycle.endsAt));

    function cancelEdit() {
        setName(cycle.name);
        setStartsAt(toLocalInput(cycle.startsAt));
        setEndsAt(toLocalInput(cycle.endsAt));
        setIsEditing(false);
    }

    function saveEdit() {
        const nextName = name.trim();
        if (!nextName) return;
        onUpdate({ name: nextName, startsAt: toIso(startsAt), endsAt: toIso(endsAt) });
        setIsEditing(false);
    }

    return (
        <div className="flex flex-wrap items-center gap-3 px-3 py-3">
            <div className="min-w-0 flex-1">
                {isEditing ? (
                    <div className="grid gap-2 sm:grid-cols-3">
                        <Input size="sm" value={name} onChange={setName} aria-label={`${cycle.name} name`} className="sm:col-span-3" />
                        <Input size="sm" type="datetime-local" value={startsAt} onChange={setStartsAt} aria-label={`${cycle.name} starts`} />
                        <Input size="sm" type="datetime-local" value={endsAt} onChange={setEndsAt} aria-label={`${cycle.name} ends`} />
                    </div>
                ) : (
                    <>
                        <p className="truncate text-sm font-medium text-primary">{cycle.name}</p>
                        <p className="mt-1 text-xs text-tertiary">Cycle {cycle.number}{cycle.startsAt || cycle.endsAt ? ` · ${formatPeriod(cycle.startsAt, cycle.endsAt)}` : " · No period set"}</p>
                    </>
                )}
            </div>
            {isProjectOwner ? (
                <Select
                    className="w-32"
                    size="sm"
                    selectedKey={cycle.status}
                    isDisabled={isPending}
                    aria-label={`${cycle.name} status`}
                    items={Object.entries(statusLabels).map(([value, label]) => ({ id: value, label }))}
                    onSelectionChange={(next) => onStatusChange((next ?? cycle.status) as Cycle["status"])}
                >
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>
            ) : <span className="text-xs text-tertiary">{statusLabels[cycle.status]}</span>}
            {isProjectOwner && (
                <div className="flex items-center gap-1">
                    {isEditing ? (
                        <>
                            <Button size="xs" isDisabled={isPending || !name.trim()} isLoading={isPending} onClick={saveEdit}>Save</Button>
                            <Button size="xs" color="tertiary" isDisabled={isPending} onClick={cancelEdit}>Cancel</Button>
                        </>
                    ) : <ButtonUtility icon={Pencil} size="sm" color="tertiary" tooltip="Edit cycle" isDisabled={isPending} onClick={() => setIsEditing(true)} />}
                    <ConfirmDialog trigger={<ButtonUtility icon={Trash2} size="sm" color="tertiary" tooltip="Delete cycle" isDisabled={isPending} />} title="Delete cycle" description={`The cycle "${cycle.name}" will be deleted. Issues in it will remain available.`} confirmLabel="Delete cycle" isPending={isPending} onConfirm={onDelete} />
                </div>
            )}
        </div>
    );
}

function toIso(value: string) {
    return value ? new Date(value).toISOString() : null;
}

function toLocalInput(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
}

function formatPeriod(startsAt: string | null, endsAt: string | null) {
    const format = (value: string | null) => (value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value)) : "?");
    return `${format(startsAt)} – ${format(endsAt)}`;
}
