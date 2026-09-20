import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useCreateColumn } from "../hooks/use-board";
import { COLUMN_COLORS } from "./column-color";
import { ColumnColorPicker } from "./column-color-picker";
import { useTranslation } from "react-i18next";

export const AddColumnForm = ({ projectId }: { projectId: string }) => {
    const { t } = useTranslation();
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState("");
    const [color, setColor] = useState<string>(COLUMN_COLORS[0]);
    const mutation = useCreateColumn(projectId);

    function reset() {
        setName("");
        setColor(COLUMN_COLORS[0]);
        setIsAdding(false);
    }

    if (!isAdding) {
        return (
            <div className="w-[350px] shrink-0">
                <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setIsAdding(true)} className="w-full justify-start">
                    {t("settings.newColumn")}
                </Button>
            </div>
        );
    }

    return (
        <form
            className="flex w-[350px] shrink-0 flex-col gap-2 rounded-md bg-layer-1 p-2"
            onSubmit={(event) => {
                event.preventDefault();
                const trimmed = name.trim();
                if (!trimmed) return;
                mutation.mutate({ name: trimmed, color }, { onSuccess: reset });
            }}
        >
            <Input size="sm" aria-label={t("settings.columnName")} placeholder={t("settings.columnName")} value={name} onChange={setName} autoFocus />

            <ColumnColorPicker value={color} onChange={setColor} />

            <div className="flex gap-2">
                <Button type="submit" size="sm" isLoading={mutation.isPending}>
                    {t("common.add")}
                </Button>
                <Button type="button" size="sm" color="secondary" onClick={reset}>
                    {t("common.cancel")}
                </Button>
            </div>
        </form>
    );
};
