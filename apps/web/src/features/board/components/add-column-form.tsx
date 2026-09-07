import { Plus } from "@untitledui/icons";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useCreateColumn } from "../hooks/use-board";
import { COLUMN_COLORS } from "./column-color";
import { ColumnColorPicker } from "./column-color-picker";

export const AddColumnForm = ({ projectId }: { projectId: string }) => {
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
            <div className="w-80 shrink-0">
                <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setIsAdding(true)} className="w-full justify-start">
                    Nova coluna
                </Button>
            </div>
        );
    }

    return (
        <form
            className="flex w-80 shrink-0 flex-col gap-3 rounded-xl bg-secondary p-3"
            onSubmit={(event) => {
                event.preventDefault();
                const trimmed = name.trim();
                if (!trimmed) return;
                mutation.mutate({ name: trimmed, color }, { onSuccess: reset });
            }}
        >
            <Input size="sm" aria-label="Nome da coluna" placeholder="Nome da coluna" value={name} onChange={setName} autoFocus />

            <ColumnColorPicker value={color} onChange={setColor} />

            <div className="flex gap-2">
                <Button type="submit" size="sm" isLoading={mutation.isPending}>
                    Adicionar
                </Button>
                <Button type="button" size="sm" color="secondary" onClick={reset}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
};
