import { Alert } from "@/components/base/feedback/alert";
import { useTranslation } from "react-i18next";

export const ErrorMessage = ({ message }: { message?: string }) => {
    const { t } = useTranslation();
    return <Alert tone="error">{message ?? t("common.couldNotLoadData")}</Alert>;
};
