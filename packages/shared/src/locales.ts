import { z } from "zod";

export const supportedLocales = ["pt-BR", "en"] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = "pt-BR";
export const localeSchema = z.enum(supportedLocales);

export function resolveLocale(value: unknown): Locale {
    return supportedLocales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}
