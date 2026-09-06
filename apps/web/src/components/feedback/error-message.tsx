import { AlertCircle } from "@untitledui/icons";

export const ErrorMessage = ({ message = "Não foi possível carregar os dados." }: { message?: string }) => (
    <div className="flex items-center gap-2 rounded-lg border border-error_subtle bg-error-primary/10 px-4 py-3 text-sm text-error-primary">
        <AlertCircle className="size-4 shrink-0" />
        {message}
    </div>
);
