import { Clipboard, Copy01, Scissors01 } from "@untitledui/icons";
import { type FC, type ReactNode, useEffect, useRef, useState } from "react";
import { useClipboard } from "@/hooks/use-clipboard";
import { asEditableElement, cutFromElement, getSelectionText, pasteIntoElement } from "@/lib/dom-clipboard";
import { cx } from "@/utils/cx";

interface ContextMenuItem {
    key: string;
    label: string;
    icon: FC<{ className?: string }>;
    disabled?: boolean;
    onSelect: () => void;
}

interface ContextMenuState {
    x: number;
    y: number;
    items: ContextMenuItem[];
}

const MENU_WIDTH_ESTIMATE = 200;
const MENU_ITEM_HEIGHT_ESTIMATE = 40;

/**
 * Menu de contexto customizado pro site inteiro: botão direito normal abre este menu; Shift +
 * botão direito deixa o menu nativo do navegador abrir (event.shiftKey checado antes do
 * preventDefault). Sobre um elemento com `data-card-id`, adiciona "Copiar card" no topo.
 *
 * Não usa o `Menu`/`Popover` do React Aria porque eles posicionam relativo a um elemento DOM real
 * (`triggerRef`), não a coordenadas de mouse cruas — pra um context menu, um `<div>` customizado
 * com `position: fixed` nas coordenadas do clique é mais direto e previsível.
 */
export const ContextMenuProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<ContextMenuState | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { copy } = useClipboard();

    useEffect(() => {
        function handleContextMenu(event: MouseEvent) {
            if (event.shiftKey) return;
            event.preventDefault();

            const target = event.target as HTMLElement | null;
            const cardEl = target?.closest<HTMLElement>("[data-card-id]");
            // Captura o campo editável focado AGORA — no clique do item do menu o foco já vai ter
            // saído daqui pro próprio botão clicado, então isso não pode ser relido depois.
            const editableTarget = asEditableElement(document.activeElement);
            const selection = getSelectionText(editableTarget);
            const editable = !!editableTarget;

            const items: ContextMenuItem[] = [];

            if (cardEl) {
                items.push({
                    key: "copy-card",
                    label: "Copiar card",
                    icon: Copy01,
                    onSelect: () => {
                        const title = cardEl.dataset.cardTitle ?? "";
                        const description = cardEl.dataset.cardDescription ?? "";
                        copy(description ? `${title}\n${description}` : title);
                    },
                });
            }

            items.push(
                { key: "copy", label: "Copiar", icon: Copy01, disabled: !selection, onSelect: () => copy(selection) },
                {
                    key: "cut",
                    label: "Recortar",
                    icon: Scissors01,
                    disabled: !editable || !selection,
                    onSelect: () => {
                        if (!editableTarget) return;
                        const cutText = cutFromElement(editableTarget);
                        if (cutText) copy(cutText);
                    },
                },
                {
                    key: "paste",
                    label: "Colar",
                    icon: Clipboard,
                    disabled: !editable,
                    onSelect: () => {
                        if (!editableTarget) return;
                        navigator.clipboard
                            .readText()
                            .then((text) => pasteIntoElement(editableTarget, text))
                            .catch(() => {
                                // navegador negou a leitura da área de transferência (permissão/contexto inseguro) — sem fallback possível aqui.
                            });
                    },
                },
            );

            const x = Math.min(event.clientX, window.innerWidth - MENU_WIDTH_ESTIMATE - 8);
            const y = Math.min(event.clientY, window.innerHeight - items.length * MENU_ITEM_HEIGHT_ESTIMATE - 8);

            setState({ x: Math.max(8, x), y: Math.max(8, y), items });
        }

        document.addEventListener("contextmenu", handleContextMenu);
        return () => document.removeEventListener("contextmenu", handleContextMenu);
    }, [copy]);

    useEffect(() => {
        if (!state) return;

        function handlePointerDown(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setState(null);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setState(null);
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
                <div
                    ref={menuRef}
                    role="menu"
                    style={{ left: state.x, top: state.y }}
                    className="fixed z-50 min-w-[200px] rounded-lg bg-primary py-1 shadow-lg ring-1 ring-secondary"
                >
                    {state.items.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            role="menuitem"
                            disabled={item.disabled}
                            onClick={() => {
                                item.onSelect();
                                setState(null);
                            }}
                            className={cx(
                                "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition duration-100 ease-linear hover:bg-primary_hover",
                                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
                            )}
                        >
                            <item.icon className="size-4 shrink-0 text-fg-quaternary" />
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
};
