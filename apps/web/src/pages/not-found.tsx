import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { useTranslation } from "react-i18next";

export function NotFound() {
    const router = useNavigate();
    const { t } = useTranslation();

    return (
        <section className="flex min-h-dvh items-center justify-center bg-surface-1 px-4 py-12 sm:px-6">
            <div className="w-full max-w-md rounded-xl border border-subtle bg-surface-2/40 p-6 shadow-2xl sm:p-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <span className="font-mono text-xs uppercase tracking-[0.16em] text-accent-primary">{t("errors.notFoundTitle")}</span>
                        <h1 className="text-display-xs font-semibold tracking-tight text-primary">{t("errors.pageMissing")}</h1>
                        <p className="text-sm leading-relaxed text-tertiary">{t("errors.pageMissingDescription")}</p>
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button color="secondary" size="md" iconLeading={ArrowLeft} onClick={() => router(-1)}>
                            {t("common.back")}
                        </Button>
                        <Button size="md" onClick={() => router("/")}>
                            {t("errors.goHome")}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
