import { useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
    ArrowDownOutline as ArrowDown,
    TopArrowOutline as ArrowUp,
    ChevronDownOutline as ChevronDown,
    StateOutline as CircleDashed,
    EditOutline as Pencil,
    AddOutline as Plus,
    DeleteOutline as Trash2,
} from "@makeplane/propel/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Alert } from "@/components/base/feedback/alert";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import { NamedColorForm } from "@/components/settings/named-color-form";
import { SettingsHeading } from "@/components/settings/settings-layout";
import { ApiError } from "@/lib/api-client";
import { useColumns, useCreateColumn, useDeleteColumn, useUpdateColumn } from "../hooks/use-board";
import { positionAtIndex } from "../position";
import { COLUMN_COLORS } from "./column-color";
import { useTranslation } from "react-i18next";

export const ColumnsPanel = ({ projectId, isProjectOwner }: { projectId: string; isProjectOwner: boolean }) => {
    const { t } = useTranslation();
    const { data: columns, isLoading, isError } = useColumns(projectId);
    const createColumn = useCreateColumn(projectId);
    const updateColumn = useUpdateColumn(projectId);
    const deleteColumn = useDeleteColumn(projectId);
    const [editor, setEditor] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pending = updateColumn.isPending || deleteColumn.isPending || createColumn.isPending;
    const showError = (reason: unknown) => setError(reason instanceof ApiError ? reason.message : t("settings.couldNotUpdateWorkflow"));

    function moveColumn(columnId: string, direction: -1 | 1) {
        if (!columns) return;
        const from = columns.findIndex((column) => column.id === columnId);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= columns.length) return;
        const ordered = arrayMove(columns, from, to);
        const position = positionAtIndex(
            ordered.filter((column) => column.id !== columnId),
            to,
        );
        setError(null);
        updateColumn.mutate({ columnId, input: { position } }, { onError: showError });
    }
    return (
        <div className="space-y-6">
            <SettingsHeading title={t("settings.states")} description={t("settings.defineWorkflow")} />
            {error && <Alert tone="error">{error}</Alert>}
            {isLoading ? (
                <LoadingState label={t("settings.loadingStates")} />
            ) : isError ? (
                <ErrorMessage message={t("settings.couldNotLoadStates")} />
            ) : (
                <section className="space-y-1 rounded-sm border border-subtle bg-surface-2 p-2">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-sm p-1 text-left text-sm font-medium text-secondary outline-accent-strong"
                            aria-expanded={expanded}
                            aria-controls="workflow-states"
                            onClick={() => setExpanded(!expanded)}
                        >
                            <ChevronDown className={`size-5 transition-transform ${expanded ? "" : "-rotate-90"}`} />
                            <CircleDashed className="size-5 text-tertiary" />
                            {t("settings.workflow")} <span className="text-xs font-normal text-tertiary">{columns?.length ?? 0}</span>
                        </button>
                        {isProjectOwner && (
                            <ButtonUtility
                                icon={Plus}
                                size="sm"
                                color="tertiary"
                                tooltip={t("settings.addState")}
                                isDisabled={pending}
                                onClick={() => {
                                    setEditor("new");
                                    setExpanded(true);
                                }}
                            />
                        )}
                    </div>
                    <div id="workflow-states" hidden={!expanded} className="space-y-1">
                        {editor === "new" && (
                            <NamedColorForm
                                key="new"
                                label={t("settings.stateName")}
                                initialColor={COLUMN_COLORS[0]}
                                submitLabel={t("settings.addState")}
                                onSave={(input) => createColumn.mutateAsync(input)}
                                onClose={() => setEditor(null)}
                            />
                        )}
                        {!columns?.length && editor !== "new" && <EmptyState title={t("settings.noStates")} description={t("settings.addStateHint")} />}
                        <ul className="space-y-1">
                            {columns?.map((column, index) => (
                                <li key={column.id}>
                                    {editor === column.id ? (
                                        <NamedColorForm
                                            label={t("settings.stateName")}
                                            initialName={column.name}
                                            initialColor={column.color}
                                            submitLabel={t("common.save")}
                                            onSave={(input) => updateColumn.mutateAsync({ columnId: column.id, input })}
                                            onClose={() => setEditor(null)}
                                        />
                                    ) : (
                                        <div className="group flex min-h-12 items-center justify-between gap-3 rounded-sm border border-subtle bg-surface-1 px-3.5 py-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <CircleDashed className="size-4 shrink-0" style={{ color: column.color ?? "#87888c" }} />
                                                <span className="truncate text-sm text-secondary">{column.name}</span>
                                            </div>
                                            {isProjectOwner && (
                                                <div className="flex shrink-0 items-center gap-1 opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 md:opacity-0">
                                                    <ButtonUtility
                                                        icon={ArrowUp}
                                                        size="sm"
                                                        color="tertiary"
                                                        tooltip={t("settings.moveStateUp")}
                                                        isDisabled={pending || index === 0}
                                                        onClick={() => moveColumn(column.id, -1)}
                                                    />
                                                    <ButtonUtility
                                                        icon={ArrowDown}
                                                        size="sm"
                                                        color="tertiary"
                                                        tooltip={t("settings.moveStateDown")}
                                                        isDisabled={pending || index === (columns?.length ?? 0) - 1}
                                                        onClick={() => moveColumn(column.id, 1)}
                                                    />
                                                    <ButtonUtility
                                                        icon={Pencil}
                                                        size="sm"
                                                        color="tertiary"
                                                        tooltip={`${t("common.edit")} ${column.name}`}
                                                        isDisabled={pending}
                                                        onClick={() => setEditor(column.id)}
                                                    />
                                                    <ConfirmDialog
                                                        trigger={
                                                            <ButtonUtility
                                                                icon={Trash2}
                                                                size="sm"
                                                                color="tertiary"
                                                                tooltip={t("settings.deleteState")}
                                                                isDisabled={pending}
                                                            />
                                                        }
                                                        title={t("settings.deleteState")}
                                                        description={t("settings.deleteStateDescription", { name: column.name })}
                                                        confirmLabel={t("settings.deleteState")}
                                                        isPending={deleteColumn.isPending}
                                                        onConfirm={() => {
                                                            setError(null);
                                                            deleteColumn.mutate(column.id, { onError: showError });
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}
        </div>
    );
};
