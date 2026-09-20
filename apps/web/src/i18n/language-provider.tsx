import { createContext, type ReactNode, use, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { defaultLocale, supportedLocales, type Locale } from "@gikan/shared";
import i18n from "./i18n";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AUTH_QUERY_KEY, updateLocale } from "@/features/auth/api";

interface LanguageContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    syncFailed: boolean;
    retrySync: () => void;
}
const LanguageContext = createContext<LanguageContextValue | null>(null);
const anonymousLocaleKey = "gikan.locale.anonymous";
const userLocaleKey = (id: string) => `gikan.locale.user:${id}`;
const pendingLocaleKey = (id: string) => `gikan.locale.pending:${id}`;
const isLocale = (value: unknown): value is Locale => supportedLocales.includes(value as Locale);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const queryClient = useQueryClient();
    const [locale, setLocaleState] = useState<Locale>(() => {
        try {
            const saved = localStorage.getItem(anonymousLocaleKey);
            return isLocale(saved) ? saved : defaultLocale;
        } catch { return defaultLocale; }
    });
    const [syncFailed, setSyncFailed] = useState(false);
    const desiredLocale = useRef(locale);
    const queue = useRef(Promise.resolve());

    const apply = useCallback((next: Locale) => {
        desiredLocale.current = next;
        setLocaleState(next);
        void i18n.changeLanguage(next);
        document.documentElement.lang = next;
        try {
            localStorage.setItem(user ? userLocaleKey(user.id) : anonymousLocaleKey, next);
        } catch { /* Language still applies for this session when storage is unavailable. */ }
    }, [user]);

    useLayoutEffect(() => {
        if (user) {
            const accountLocale = isLocale(user.locale) ? user.locale : defaultLocale;
            let pendingLocale: unknown;
            try {
                if (localStorage.getItem(pendingLocaleKey(user.id)) === "true") pendingLocale = localStorage.getItem(userLocaleKey(user.id));
            } catch { pendingLocale = undefined; }
            const next = isLocale(pendingLocale) ? pendingLocale : accountLocale;
            if (next === accountLocale) {
                try { localStorage.removeItem(pendingLocaleKey(user.id)); } catch { /* Server preference remains authoritative. */ }
            }
            desiredLocale.current = next;
            setLocaleState(next);
            setSyncFailed(next !== accountLocale);
            void i18n.changeLanguage(next);
            document.documentElement.lang = next;
        } else if (!isLoading) {
            let anonymous: unknown;
            try { anonymous = localStorage.getItem(anonymousLocaleKey); } catch { anonymous = undefined; }
            const next = isLocale(anonymous) ? anonymous : defaultLocale;
            desiredLocale.current = next;
            setLocaleState(next);
            void i18n.changeLanguage(next);
            document.documentElement.lang = next;
        }
    }, [user?.id, user?.locale, isLoading]);

    const persist = useCallback(() => {
        if (!user) return;
        setSyncFailed(false);
        const userId = user.id;
        const next = desiredLocale.current;
        queue.current = queue.current
            .catch(() => undefined)
            .then(async () => {
                const updated = await updateLocale(next);
                if (desiredLocale.current === next && userId === user.id) {
                    try { localStorage.removeItem(pendingLocaleKey(userId)); } catch { /* Server preference has been saved. */ }
                    queryClient.setQueryData(AUTH_QUERY_KEY, updated);
                    setSyncFailed(false);
                }
            })
            .catch(() => {
                if (desiredLocale.current === next && userId === user.id) {
                    try { localStorage.setItem(pendingLocaleKey(userId), "true"); } catch { /* Keep the selected locale for this session. */ }
                    setSyncFailed(true);
                }
            });
    }, [user, queryClient]);

    const setLocale = useCallback((next: Locale) => {
        apply(next);
        if (user) persist();
    }, [apply, persist, user]);

    useEffect(() => {
        if (!user || !syncFailed) return;
        const onOnline = () => persist();
        window.addEventListener("online", onOnline);
        return () => window.removeEventListener("online", onOnline);
    }, [user, syncFailed, persist]);

    return <LanguageContext value={{ locale, setLocale, syncFailed, retrySync: persist }}>{children}</LanguageContext>;
}

export function useLanguage() {
    const value = use(LanguageContext);
    if (!value) throw new Error("useLanguage must be used within LanguageProvider");
    return value;
}
