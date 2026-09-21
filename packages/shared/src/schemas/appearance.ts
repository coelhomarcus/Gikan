import { z } from "zod";

/** A remote image accepted by the application. Files are rendered by the browser; the API never fetches them. */
export const remoteImageUrlSchema = z
    .string()
    .trim()
    .max(4096, "Image URL is too long")
    .url("Invalid URL")
    .refine((value) => /^https?:\/\/(?![^/]*@)/i.test(value), "Images require an HTTP or HTTPS URL without credentials");

const emojiValueSchema = z
    .string()
    .trim()
    .min(1, "Choose an emoji")
    .max(64, "Emoji is too long")
    // Covers pictographs and flags while preserving complete ZWJ/skin-tone sequences as entered.
    .refine((value) => /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(value), "Choose an emoji");

export const catalogIconSchema = z.object({ type: z.literal("icon"), key: z.string().trim().min(1).max(100) });
export const emojiIconSchema = z.object({ type: z.literal("emoji"), value: emojiValueSchema });
export const imageIconSchema = z.object({ type: z.literal("image"), url: remoteImageUrlSchema });
export const entityIconSchema = z.discriminatedUnion("type", [catalogIconSchema, emojiIconSchema, imageIconSchema]);

export const coverSchema = z.object({
    url: remoteImageUrlSchema,
    position: z.object({
        x: z.number().finite().min(0).max(100),
        y: z.number().finite().min(0).max(100),
    }),
});

export type EntityIcon = z.infer<typeof entityIconSchema>;
export type EntityCover = z.infer<typeof coverSchema>;
