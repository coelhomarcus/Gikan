import { en } from "./en";
import { ptBR } from "./pt-BR";

export { en, ptBR };

type TranslationKeyPath<T> = {
    [K in keyof T & string]: T[K] extends string ? K : T[K] extends object ? `${K}.${TranslationKeyPath<T[K]>}` : never;
}[keyof T & string];

export type TranslationKey = TranslationKeyPath<typeof en>;
