import { AlertCircle } from "lucide-react";

export const ErrorMessage = ({ message = "Could not load the data." }: { message?: string }) => (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-error_subtle bg-error-primary/10 px-4 py-3 text-sm text-error-primary">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {message}
    </div>
);
