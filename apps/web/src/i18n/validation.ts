import type { TFunction } from "i18next";

export function translateValidationMessage(message: string | undefined, t: TFunction): string | undefined {
    if (!message) return message;
    if (message.startsWith("validation.")) return t(message as "validation.required");
    if (/^required$/i.test(message)) return t("validation.required");
    if (/^invalid email$/i.test(message)) return t("validation.invalidEmail");
    if (/^invalid url$/i.test(message)) return t("validation.invalidUrl");
    if (/^invalid uuid$/i.test(message)) return t("validation.invalidUuid");
    if (message === "Username must be 3-32 characters: lowercase letters, numbers, and _") return t("validation.usernameFormat");
    if (message === "Images require an HTTP or HTTPS URL.") return t("validation.imagesHttp");
    if (/^Project key must contain 2 to 8 uppercase letters or numbers$/i.test(message)) return t("validation.projectKeyFormat");
    if (/^Color must be a valid hex value/i.test(message)) return t("validation.hexColor");
    if (/^The page can contain at most 100,000 characters$/i.test(message)) return t("validation.documentContentSize");
    const min = /^String must contain at least (\d+) character\(s\)$/i.exec(message);
    if (min) return t("validation.minLength", { count: Number(min[1]) });
    const max = /^String must contain at most (\d+) character\(s\)$/i.exec(message);
    if (max) return t("validation.maxLength", { count: Number(max[1]) });
    return message;
}
