import type { TFunction } from "i18next";

export function translateStatusName(name: string, t: TFunction): string {
    const normalized = name.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (["to do", "todo", "a fazer"].includes(normalized)) return t("issue.todo");
    if (["backlog", "fila"].includes(normalized)) return t("issue.backlog");
    if (["in progress", "in-progress", "em andamento"].includes(normalized)) return t("issue.inProgress");
    if (["done", "complete", "completed", "concluido", "concluida"].includes(normalized)) return t("issue.done");
    return name;
}

