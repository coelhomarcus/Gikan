import { zodResolver } from "@hookform/resolvers/zod";
import { createCardSchema } from "@todokanban/shared";
import { Plus } from "@untitledui/icons";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/base/buttons/button";
import { ControlledInput } from "@/components/form/controlled-input";
import { useCreateCard } from "../hooks/use-board";

interface QuickAddCardProps {
    projectId: string;
    columnId: string;
}

export const QuickAddCard = ({ projectId, columnId }: QuickAddCardProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const mutation = useCreateCard(projectId);

    // Sem generic explícito no useForm: createCardSchema tem `.default()` em `difficulty`,
    // o que cria um input/output type diferente no zod — deixar o TS inferir a partir do
    // resolver evita o erro de tipo entre o shape de entrada e o de saída validada.
    const { control, handleSubmit, reset } = useForm({
        resolver: zodResolver(createCardSchema),
        defaultValues: { columnId, title: "", difficulty: "medium" as const },
    });

    if (!isAdding) {
        return (
            <Button color="tertiary" size="sm" iconLeading={Plus} onClick={() => setIsAdding(true)} className="w-full justify-start">
                Adicionar card
            </Button>
        );
    }

    return (
        <form
            className="flex flex-col gap-2"
            noValidate
            onSubmit={handleSubmit((data) => {
                mutation.mutate(data, {
                    onSuccess: () => reset({ columnId, title: "", difficulty: "medium" }),
                });
            })}
        >
            <ControlledInput control={control} name="title" placeholder="Título do card" autoFocus size="sm" />
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
