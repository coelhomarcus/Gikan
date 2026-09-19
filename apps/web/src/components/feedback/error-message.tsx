import { Alert } from "@/components/base/feedback/alert";

export const ErrorMessage = ({ message = "Could not load the data." }: { message?: string }) => <Alert tone="error">{message}</Alert>;
