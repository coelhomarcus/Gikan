import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLocale, supportedLocales } from "@gikan/shared";
import { en, ptBR } from "./resources";

void i18n.use(initReactI18next).init({
    resources: { "pt-BR": { translation: ptBR }, en: { translation: en } },
    lng: defaultLocale,
    fallbackLng: "en",
    supportedLngs: supportedLocales,
    defaultNS: "translation",
    ns: ["translation"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
});

export default i18n;
