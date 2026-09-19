import type { ComponentType, SVGProps } from "react";
import {
    ArrowNarrowLeftOutline, BoardOutline, ChevronDownOutline, CloseOutline, CyclesOutline,
    GeneralOutline, ListOutline, LogOutOutline, NewTabArrowOutline, OverviewOutline, PagesOutline,
    ProjectsOutline, SearchOutline, SettingsOutline, LeftSidePaneOutline,
} from "@makeplane/propel/icons";

export type AppIcon = ComponentType<SVGProps<SVGSVGElement>>;
export const AppIcons = {
    ChevronDown: ChevronDownOutline, Close: CloseOutline, Back: ArrowNarrowLeftOutline,
    Board: BoardOutline, Documents: PagesOutline, ExternalLink: NewTabArrowOutline,
    Issues: ListOutline, Menu: LeftSidePaneOutline, Overview: OverviewOutline,
    Projects: ProjectsOutline, Search: SearchOutline, Settings: SettingsOutline,
    SignOut: LogOutOutline, Cycles: CyclesOutline, General: GeneralOutline,
} satisfies Record<string, AppIcon>;
