import { type ReactNode, useEffect, useRef, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";

interface ContextMenuItem {
    key: string;
    label: string;
    icon: typeof Copy;
    onSelect: () => void;
}

interface ContextMenuState {
    x: number;
    y: number;
    items: ContextMenuItem[];
}

const MENU_WIDTH_ESTIMATE = 220;
const MENU_ITEM_HEIGHT_ESTIMATE = 36;

/** Adds an entity-scoped menu to issue rows and tiles while preserving native menus elsewhere. */
export const ContextMenuProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<ContextMenuState | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { copy } = useClipboard();
    const navigate = useNavigate();

    useEffect(() => {
        function handleContextMenu(event: MouseEvent) {
            const target = event.target as HTMLElement | null;
            const issueElement = target?.closest<HTMLElement>("[data-issue-context]");
            if (!issueElement) return;

            event.preventDefault();
            const identifier = issueElement.dataset.issueIdentifier ?? "";
            const projectId = issueElement.dataset.projectId ?? "";
            const issueUrl = `/projects/${projectId}/issues/${identifier}`;
            const items: ContextMenuItem[] = [
                {
                    key: "copy-issue",
                    label: "Copy issue link",
                    icon: Copy,
                    onSelect: () => copy(`${window.location.origin}${issueUrl}`),
                },
                {
                    key: "open-issue",
                    label: "Open issue",
                    icon: ExternalLink,
                    onSelect: () => navigate(issueUrl),
                },
            ];

            const x = Math.min(event.clientX, window.innerWidth - MENU_WIDTH_ESTIMATE - 8);
            const y = Math.min(event.clientY, window.innerHeight - items.length * MENU_ITEM_HEIGHT_ESTIMATE - 8);
            setState({ x: Math.max(8, x), y: Math.max(8, y), items });
        }

        document.addEventListener("contextmenu", handleContextMenu);
        return () => document.removeEventListener("contextmenu", handleContextMenu);
    }, [copy, navigate]);

    useEffect(() => {
        if (!state) return;
        menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

        function handlePointerDown(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setState(null);
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                setState(null);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [state]);

    return (
        <>
            {children}
            {state && (
                <div ref={menuRef} role="menu" style={{ left: state.x, top: state.y }} className="fixed z-50 min-w-[220px] rounded-lg bg-primary py-1 shadow-lg ring-1 ring-secondary">
                    {state.items.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                item.onSelect();
                                setState(null);
                            }}
                            className={cx("flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition duration-100 ease-linear hover:bg-primary_hover hover:text-primary", "focus-visible:bg-primary_hover focus-visible:text-primary focus-visible:outline-none")}
                        >
                            <item.icon aria-hidden="true" className="size-4 shrink-0 text-fg-quaternary" />
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
};
