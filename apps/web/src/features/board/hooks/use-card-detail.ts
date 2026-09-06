import { useQuery } from "@tanstack/react-query";
import { getCardDetail } from "../api";

export function cardDetailKey(cardId: string) {
    return ["cards", cardId] as const;
}

export function useCardDetail(cardId: string | null) {
    return useQuery({
        queryKey: cardDetailKey(cardId ?? ""),
        queryFn: () => getCardDetail(cardId!),
        enabled: !!cardId,
    });
}
