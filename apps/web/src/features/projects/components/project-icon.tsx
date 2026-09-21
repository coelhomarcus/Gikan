import type { EntityIcon, ProjectIconKey } from "@gikan/shared";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
    Activity,
    AppWindow,
    Archive,
    Atom,
    Award,
    BookOpen,
    Box,
    Blocks,
    Bot,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    ChartNoAxesCombined,
    Code2,
    Compass,
    Cloud,
    Cpu,
    Database,
    Diamond,
    Fingerprint,
    Flag,
    FlaskConical,
    Folder,
    Gamepad2,
    Gauge,
    Gift,
    Globe2,
    Heart,
    Headphones,
    House,
    Layers3,
    Leaf,
    Lightbulb,
    LockKeyhole,
    Map,
    MessageCircle,
    Monitor,
    Music,
    Package,
    Palette,
    PenLine,
    Plane,
    Puzzle,
    Rocket,
    Server,
    Shield,
    ShoppingCart,
    Sparkles,
    Star,
    Store,
    Tag,
    Target,
    Telescope,
    Terminal,
    ThumbsUp,
    Ticket,
    Video,
    Wallet,
    Workflow,
    Users,
    Wrench,
    Zap,
    Smartphone,
} from "lucide-react";

/**
 * Maps shared keys (validated by the backend; see `projectIconKeys` in @gikan/shared) to the
 * library's concrete components. Importing each icon by name preserves tree-shaking — dynamic
 * access such as `icons[name]` would pull the complete library into the bundle.
 */
const PROJECT_ICONS: Record<ProjectIconKey, LucideIcon> = {
    cube: Box,
    rocket: Rocket,
    code: Code2,
    browser: AppWindow,
    briefcase: BriefcaseBusiness,
    book: BookOpen,
    chart: ChartNoAxesCombined,
    target: Target,
    lightbulb: Lightbulb,
    flag: Flag,
    star: Star,
    heart: Heart,
    globe: Globe2,
    server: Server,
    database: Database,
    mobile: Smartphone,
    desktop: Monitor,
    cart: ShoppingCart,
    zap: Zap,
    package: Package,
    palette: Palette,
    pen: PenLine,
    users: Users,
    tool: Wrench,
    activity: Activity,
    archive: Archive,
    atom: Atom,
    award: Award,
    blocks: Blocks,
    bot: Bot,
    building: Building2,
    calendar: CalendarDays,
    cloud: Cloud,
    compass: Compass,
    cpu: Cpu,
    diamond: Diamond,
    fingerprint: Fingerprint,
    flask: FlaskConical,
    folder: Folder,
    gamepad: Gamepad2,
    gauge: Gauge,
    gift: Gift,
    headphones: Headphones,
    house: House,
    layers: Layers3,
    leaf: Leaf,
    lock: LockKeyhole,
    map: Map,
    message: MessageCircle,
    music: Music,
    plane: Plane,
    puzzle: Puzzle,
    shield: Shield,
    sparkles: Sparkles,
    store: Store,
    tag: Tag,
    terminal: Terminal,
    telescope: Telescope,
    "thumbs-up": ThumbsUp,
    ticket: Ticket,
    video: Video,
    wallet: Wallet,
    workflow: Workflow,
};

export const DEFAULT_PROJECT_ICON: ProjectIconKey = "cube";

/** Resolves the key saved in the database. Falls back when it is `null` (legacy project) or an unknown key (an icon later removed from the palette). */
export function resolveProjectIcon(key: string | null | undefined): LucideIcon {
    return PROJECT_ICONS[key as ProjectIconKey] ?? PROJECT_ICONS[DEFAULT_PROJECT_ICON];
}

interface ProjectIconProps {
    icon: EntityIcon | string | null | undefined;
    className?: string;
}

export const ProjectIcon = ({ icon, className }: ProjectIconProps) => {
    if (icon && typeof icon === "object") {
        if (icon.type === "emoji") return <span className={`inline-grid place-items-center leading-none ${className ?? ""}`} style={{ fontSize: "1.25em" }}>{icon.value}</span>;
        if (icon.type === "image") return <ProjectImageIcon url={icon.url} className={className} />;
        const Icon = resolveProjectIcon(icon.key);
        return <Icon className={className} />;
    }
    const Icon = resolveProjectIcon(icon);
    return <Icon className={className} />;
};

function ProjectImageIcon({ url, className }: { url: string; className?: string }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [url]);
    if (failed) {
        const Fallback = resolveProjectIcon(DEFAULT_PROJECT_ICON);
        return <Fallback className={className} />;
    }
    return <img src={url} alt="" referrerPolicy="no-referrer" decoding="async" onError={() => setFailed(true)} className={`object-contain ${className ?? ""}`} />;
}
