import type { FC } from "react";
import type { ProjectIconKey } from "@gikan/shared";
import {
    BarChartSquare01,
    BookOpen01,
    Briefcase01,
    Code02,
    CodeBrowser,
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

/**
 * Maps shared keys (validated by the backend; see `projectIconKeys` in @gikan/shared) to the
 * library's concrete components. Importing each icon by name preserves tree-shaking — dynamic
 * access such as `icons[name]` would pull 1,100+ library icons into the bundle.
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

/** Resolves the key saved in the database. Falls back when it is `null` (legacy project) or an unknown key (an icon later removed from the palette). */
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
