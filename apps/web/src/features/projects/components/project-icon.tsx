import type { ProjectIconKey } from "@gikan/shared";
import {
    BarChartSquare01,
    BookOpen01,
    Briefcase01,
    CodeBrowser,
    Code02,
    Cube01,
    Database01,
    Flag01,
    Globe01,
    Heart,
    Lightbulb02,
    Monitor01,
    Package,
    Palette,
    PenTool02,
    Phone01,
    Rocket02,
    Server01,
    ShoppingCart01,
    Star01,
    Target04,
    Tool01,
    Users01,
    Zap,
} from "@untitledui/icons";
import type { FC } from "react";

/**
 * Mapa das chaves compartilhadas (validadas no backend, ver `projectIconKeys` em @gikan/shared)
 * pros componentes concretos da lib. Importar cada ícone nominalmente mantém o tree-shaking —
 * um acesso dinâmico tipo `icons[nome]` arrastaria as 1100+ ícones da biblioteca pro bundle.
 */
const PROJECT_ICONS: Record<ProjectIconKey, FC<{ className?: string }>> = {
    cube: Cube01,
    rocket: Rocket02,
    code: Code02,
    browser: CodeBrowser,
    briefcase: Briefcase01,
    book: BookOpen01,
    chart: BarChartSquare01,
    target: Target04,
    lightbulb: Lightbulb02,
    flag: Flag01,
    star: Star01,
    heart: Heart,
    globe: Globe01,
    server: Server01,
    database: Database01,
    mobile: Phone01,
    desktop: Monitor01,
    cart: ShoppingCart01,
    zap: Zap,
    package: Package,
    palette: Palette,
    pen: PenTool02,
    users: Users01,
    tool: Tool01,
};

export const DEFAULT_PROJECT_ICON: ProjectIconKey = "cube";

/** Resolve a chave salva no banco. Cai no padrão se vier `null` (projeto antigo) ou uma chave desconhecida (ícone tirado da paleta depois). */
export function resolveProjectIcon(key: string | null | undefined): FC<{ className?: string }> {
    return PROJECT_ICONS[key as ProjectIconKey] ?? PROJECT_ICONS[DEFAULT_PROJECT_ICON];
}

interface ProjectIconProps {
    icon: string | null | undefined;
    className?: string;
}

export const ProjectIcon = ({ icon, className }: ProjectIconProps) => {
    const Icon = resolveProjectIcon(icon);
    return <Icon className={className} />;
};
