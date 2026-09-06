import type { CreateCardInput, CreateColumnInput, UpdateCardInput, UpdateColumnInput } from "@gikan/shared";
import { apiClient } from "@/lib/api-client";

export interface BoardColumn {
    id: string;
    projectId: string;
    name: string;
    position: number;
    createdAt: string;
}

export interface BoardCard {
    id: string;
    projectId: string;
    columnId: string;
    title: string;
    description: string | null;
    assigneeId: string | null;
    categoryId: string | null;
    importance: "low" | "medium" | "high";
    createdBy: string;
    position: number;
    createdAt: string;
    updatedAt: string;
}

export interface CardPerson {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
}

export interface CardDetail extends Omit<BoardCard, "createdBy"> {
    createdBy: CardPerson;
    assignee: CardPerson | null;
    category: { id: string; name: string; color: string | null } | null;
    column: { id: string; name: string };
}

export function listColumns(projectId: string): Promise<BoardColumn[]> {
    return apiClient.get<{ columns: BoardColumn[] }>(`/projects/${projectId}/columns`).then((res) => res.columns);
}

export function createColumn(projectId: string, input: CreateColumnInput): Promise<BoardColumn> {
    return apiClient.post<{ column: BoardColumn }>(`/projects/${projectId}/columns`, input).then((res) => res.column);
}

export function updateColumn(projectId: string, columnId: string, input: UpdateColumnInput): Promise<BoardColumn> {
    return apiClient.patch<{ column: BoardColumn }>(`/projects/${projectId}/columns/${columnId}`, input).then((res) => res.column);
}

export function deleteColumn(projectId: string, columnId: string): Promise<void> {
    return apiClient.delete<void>(`/projects/${projectId}/columns/${columnId}`);
}

export function listCards(projectId: string): Promise<BoardCard[]> {
    return apiClient.get<{ cards: BoardCard[] }>(`/projects/${projectId}/cards`).then((res) => res.cards);
}

export function createCard(projectId: string, input: CreateCardInput): Promise<BoardCard> {
    return apiClient.post<{ card: BoardCard }>(`/projects/${projectId}/cards`, input).then((res) => res.card);
}

export function getCardDetail(cardId: string): Promise<CardDetail> {
    return apiClient.get<{ card: CardDetail }>(`/cards/${cardId}`).then((res) => res.card);
}

export function updateCard(cardId: string, input: UpdateCardInput): Promise<BoardCard> {
    return apiClient.patch<{ card: BoardCard }>(`/cards/${cardId}`, input).then((res) => res.card);
}

export function deleteCard(cardId: string): Promise<void> {
    return apiClient.delete<void>(`/cards/${cardId}`);
}
