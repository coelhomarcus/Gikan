import type { Locale } from "@gikan/shared";
import { useTranslation } from "react-i18next";
import { useLanguage } from "./language-provider";
import { Button } from "@/components/base/buttons/button";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
    const { t } = useTranslation();
    const { locale, setLocale, syncFailed, retrySync } = useLanguage();
    return (
        <div className="flex items-center gap-2">
            {!compact && <label htmlFor="language-select" className="text-sm text-secondary">{t("common.language")}</label>}
            <select
                id={compact ? undefined : "language-select"}
                aria-label={t("common.language")}
                value={locale}
                onChange={(event) => setLocale(event.target.value as Locale)}
                className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-sm text-secondary outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            >
                <option value="pt-BR">{t("common.portugueseBrazil")}</option>
                <option value="en">{t("common.english")}</option>
            </select>
            {syncFailed && <Button color="tertiary" size="sm" onClick={retrySync}>{t("common.syncNow")}</Button>}
        </div>
    );
}

