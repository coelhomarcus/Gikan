import { Suspense, createContext, useContext, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useHotkeys } from "react-hotkeys-hook";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { NetworkStatus } from "@/components/feedback/network-status";
import { WorkspaceLoadingFallback } from "@/components/feedback/workspace-loading-fallback";
import { AppIcons } from "@/components/foundations/icons";
import { GikanIcon } from "@/components/foundations/logo/gikan-icon";
import { ProjectSearchModal } from "@/features/projects/components/project-search-modal";
import { Sidebar } from "./sidebar";
import { SidebarAccount } from "./sidebar-account";
import { useTranslation } from "react-i18next";

const NavigationContext = createContext({ toggleSidebar: () => {} });
export const useAppNavigation = () => useContext(NavigationContext);
const readWidth = () => {
    const value = Number(localStorage.getItem("gikan-sidebar-width") ?? 250);
    return Number.isFinite(value) ? Math.max(236, Math.min(350, value)) : 250;
};

export const AppShell = () => {
    const location = useLocation();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [width, setWidth] = useState(readWidth);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem("gikan-sidebar-collapsed") === "true");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const drag = useRef<{ x: number; width: number } | null>(null);
    const [resizing, setResizing] = useState(false);
    const settings = location.pathname === "/settings/profile";
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);
    useEffect(() => {
        localStorage.setItem("gikan-sidebar-width", String(width));
    }, [width]);
    useEffect(() => {
        localStorage.setItem("gikan-sidebar-collapsed", String(collapsed));
    }, [collapsed]);
    useHotkeys(
        "mod+k",
        (event) => {
            event.preventDefault();
            setSearchOpen(true);
        },
        { enableOnFormTags: true, enableOnContentEditable: true, eventListenerOptions: { capture: true } },
    );
    function toggleSidebar() {
        if (window.matchMedia("(max-width: 767px)").matches) setMobileOpen((open) => !open);
        else setCollapsed((value) => !value);
    }
    function resize(event: PointerEvent<HTMLDivElement>) {
        if (!drag.current) return;
        setWidth(Math.max(236, Math.min(350, drag.current.width + event.clientX - drag.current.x)));
    }
    function resizeKey(event: KeyboardEvent<HTMLDivElement>) {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        setWidth((value) =>
            event.key === "Home" ? 236 : event.key === "End" ? 350 : Math.max(236, Math.min(350, value + (event.key === "ArrowRight" ? 10 : -10))),
        );
    }
    const railItem =
        "flex w-full flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium text-tertiary hover:bg-layer-1-hover hover:text-primary focus-visible:outline-accent-strong";
    return (
        <NavigationContext.Provider value={{ toggleSidebar }}>
            <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas text-primary">
                <header className="flex h-10 shrink-0 items-center justify-between gap-2 px-3.5" aria-label={t("nav.search")}>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="md:hidden">
                            <ButtonUtility color="tertiary" icon={AppIcons.Menu} tooltip={t("nav.expand")} onClick={toggleSidebar} />
                        </span>
                        <Link to="/" className="flex items-center gap-2 rounded-sm text-sm font-semibold" aria-label="Gikan">
                            <GikanIcon className="size-5 text-primary" />
                            Gikan
                        </Link>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        className="flex h-7 w-64 max-w-[45vw] items-center gap-2 rounded-md border border-subtle bg-surface-1 px-2 text-xs text-placeholder hover:bg-layer-1-hover"
                        aria-label={t("nav.search")}
                    >
                        <AppIcons.Search className="size-3.5" />
                        <span className="truncate">{t("nav.search")}</span>
                        <kbd className="ml-auto shrink-0 rounded border border-subtle px-1 text-[10px]">⌘ K</kbd>
                    </button>
                    <div className="flex flex-1 justify-end">
                        <SidebarAccount />
                    </div>
                </header>
                <div className="flex min-h-0 flex-1 pr-2 pb-2 max-md:px-2">
                    <nav className="hidden w-[60px] shrink-0 flex-col gap-4 px-2 py-3 md:flex" aria-label={t("nav.applications")}>
                        <Link to="/" className={`${railItem} ${!settings ? "bg-layer-1 text-primary" : ""}`} aria-current={!settings ? "page" : undefined}>
                            <AppIcons.Projects className="size-5" />
                            {t("nav.projects")}
                        </Link>
                        <div className="mx-2 border-t border-strong" />
                        <Link
                            to="/settings/profile"
                            className={`${railItem} ${settings ? "bg-layer-1 text-primary" : ""}`}
                            aria-current={settings ? "page" : undefined}
                        >
                            <AppIcons.Settings className="size-5" />
                            {t("nav.config")}
                        </Link>
                    </nav>
                    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-subtle bg-surface-1" data-app-content>
                        {!collapsed && (
                            <aside
                                className="relative hidden h-full shrink-0 border-r border-subtle bg-surface-1 md:block"
                                style={{ width }}
                                aria-label={t("nav.projects")}
                            >
                                <Sidebar onCollapse={toggleSidebar} />
                                <div
                                    role="separator"
                                    aria-label={t("nav.resizeSidebar")}
                                    aria-orientation="vertical"
                                    aria-valuenow={width}
                                    aria-valuemin={236}
                                    aria-valuemax={350}
                                    tabIndex={0}
                                    className={`absolute inset-y-0 right-0 z-20 w-1 cursor-ew-resize touch-none hover:bg-layer-2 ${resizing ? "bg-accent-primary" : ""}`}
                                    onPointerDown={(event) => {
                                        drag.current = { x: event.clientX, width };
                                        setResizing(true);
                                        event.currentTarget.setPointerCapture(event.pointerId);
                                    }}
                                    onPointerMove={resize}
                                    onPointerUp={() => {
                                        drag.current = null;
                                        setResizing(false);
                                    }}
                                    onPointerCancel={() => {
                                        drag.current = null;
                                        setResizing(false);
                                    }}
                                    onKeyDown={resizeKey}
                                    onDoubleClick={toggleSidebar}
                                />
                            </aside>
                        )}
                        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" id="main-content">
                            <Suspense fallback={<WorkspaceLoadingFallback />}>
                                <Outlet />
                            </Suspense>
                        </main>
                    </div>
                </div>
                <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
                    <Dialog.Portal>
                        <Dialog.Backdrop className="fixed inset-0 z-40 bg-backdrop" />
                        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 w-[min(300px,85vw)] border-r border-subtle bg-surface-1 outline-none">
                            <Dialog.Title className="sr-only">{t("nav.navigation")}</Dialog.Title>
                            <Sidebar onCollapse={() => setMobileOpen(false)} />
                            <button
                                className="m-3 flex items-center gap-2 rounded px-2 py-1 text-sm text-secondary hover:bg-layer-1"
                                onClick={() => {
                                    setMobileOpen(false);
                                    navigate("/settings/profile");
                                }}
                            >
                                <AppIcons.Settings className="size-4" />
                                {t("nav.settings")}
                            </button>
                        </Dialog.Popup>
                    </Dialog.Portal>
                </Dialog.Root>
                {searchOpen && <ProjectSearchModal onClose={() => setSearchOpen(false)} />}
                <NetworkStatus />
            </div>
        </NavigationContext.Provider>
    );
};
