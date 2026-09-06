import { Plus } from "@untitledui/icons";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useCreateColumn } from "../hooks/use-board";

export const AddColumnForm = ({ projectId }: { projectId: string }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState("");
    const mutation = useCreateColumn(projectId);

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
            className="flex w-80 shrink-0 flex-col gap-2 rounded-xl bg-secondary p-3"
            onSubmit={(event) => {
                event.preventDefault();
                const trimmed = name.trim();
                if (!trimmed) return;
                mutation.mutate(
                    { name: trimmed },
                    {
                        onSuccess: () => {
                            setName("");
                            setIsAdding(false);
                        },
                    },
                );
            }}
        >
            <Input size="sm" aria-label="Nome da coluna" placeholder="Nome da coluna" value={name} onChange={setName} autoFocus />
            <div className="flex gap-2">
                <Button type="submit" size="sm" isLoading={mutation.isPending}>
                    Adicionar
                </Button>
                <Button type="button" size="sm" color="secondary" onClick={() => setIsAdding(false)}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
};
