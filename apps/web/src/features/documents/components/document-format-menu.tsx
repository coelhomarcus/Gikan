import { useEffect, useId, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { type Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Code2, Italic, Link2, Strikethrough, Table2 } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useTranslation } from "react-i18next";
import type { TranslationKey } from "@/i18n/resources";

export function DocumentFormatMenu({ editor }: { editor: Editor }) {
    const { t } = useTranslation();
    const [scrollTarget, setScrollTarget] = useState<HTMLElement | Window>(window);
    const [linkOpen, setLinkOpen] = useState(false);
    const dismissedSelection = useRef<string | null>(null);
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const id = useId();
    const marks = useEditorState({
        editor,
        selector: ({ editor: e }) => ({
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            strike: e.isActive("strike"),
            code: e.isActive("code"),
            table: e.isActive("table"),
        }),
    });
    useEffect(() => {
        setScrollTarget(editor.view.dom.closest<HTMLElement>("[data-document-scroll]") ?? window);
        const escape = (event: KeyboardEvent) => {
            if (event.key !== "Escape" || event.defaultPrevented) return;
            dismissedSelection.current = `${editor.state.selection.from}:${editor.state.selection.to}`;
            editor.commands.setMeta("document-format", "hide");
        };
        editor.view.dom.addEventListener("keydown", escape);
        const update = () => editor.commands.setMeta("document-format", "updatePosition");
        window.visualViewport?.addEventListener("resize", update);
        return () => {
            editor.view.dom.removeEventListener("keydown", escape);
            window.visualViewport?.removeEventListener("resize", update);
        };
    }, [editor]);
    const boundary = scrollTarget instanceof HTMLElement ? scrollTarget : undefined;
    return (
        <BubbleMenu
            editor={editor}
            pluginKey="document-format"
            appendTo={() => editor.view.dom.closest<HTMLElement>('[role="dialog"]') ?? document.body}
            updateDelay={0}
            resizeDelay={0}
            options={{
                strategy: "fixed",
                placement: "top",
                offset: 8,
                flip: { padding: 12, boundary },
                shift: { padding: 12, boundary },
                hide: { boundary },
                scrollTarget,
                size: {
                    padding: 12,
                    boundary,
                    apply({ availableWidth, availableHeight, elements }) {
                        elements.floating.style.maxWidth = `${Math.max(0, availableWidth)}px`;
                        elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
                    },
                },
            }}
            shouldShow={({ view, state, element }) => {
                const selection = `${state.selection.from}:${state.selection.to}`;
                if (dismissedSelection.current && dismissedSelection.current !== selection) dismissedSelection.current = null;
                return (
                    linkOpen ||
                    (!dismissedSelection.current &&
                        (view.hasFocus() || element.contains(document.activeElement)) &&
                        (!state.selection.empty || editor.isActive("table")) &&
                        !editor.isActive("image"))
                );
            }}
            className="document-format-menu"
            onKeyDown={(event) => {
                if (event.key === "Escape" && !linkOpen) {
                    event.preventDefault();
                    editor.chain().focus().setTextSelection(editor.state.selection.to).run();
                }
            }}
        >
            {[
                { label: t("editor.bold"), Icon: Bold, active: marks.bold, action: () => editor.chain().focus().toggleBold().run() },
                { label: t("editor.italic"), Icon: Italic, active: marks.italic, action: () => editor.chain().focus().toggleItalic().run() },
                { label: t("editor.strikethrough"), Icon: Strikethrough, active: marks.strike, action: () => editor.chain().focus().toggleStrike().run() },
                { label: t("editor.inlineCode"), Icon: Code2, active: marks.code, action: () => editor.chain().focus().toggleCode().run() },
            ].map(({ label, Icon, active, action }) => (
                <button
                    key={label}
                    type="button"
                    aria-label={label}
                    title={label}
                    aria-pressed={active}
                    className="document-format-button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={action}
                >
                    <Icon className="size-4" />
                </button>
            ))}
            <Popover.Root
                open={linkOpen}
                onOpenChange={(value) => {
                    setLinkOpen(value);
                    if (value) {
                        setUrl(editor.getAttributes("link").href ?? "");
                        setError("");
                    }
                }}
            >
                <Popover.Trigger className="document-format-button" aria-label={t("editor.editLink")}>
                    <Link2 className="size-4" />
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Positioner side="bottom" sideOffset={8} collisionPadding={12} className="document-overlay">
                        <Popover.Popup finalFocus={() => editor.view.dom} className="document-popover w-72">
                            <Popover.Title className="mb-3 text-sm font-medium">{t("editor.link")}</Popover.Title>
                            <form
                                className="space-y-3"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (!/^(https?:\/\/|mailto:)/i.test(url.trim())) {
                                        setError(t("editor.validLink"));
                                        return;
                                    }
                                    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
                                    setLinkOpen(false);
                                }}
                            >
                                <Input id={id} label={t("editor.linkUrl")} value={url} onChange={setUrl} isInvalid={!!error} hint={error} autoFocus />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        color="tertiary"
                                        onClick={() => {
                                            editor.chain().focus().extendMarkRange("link").unsetLink().run();
                                            setLinkOpen(false);
                                        }}
                                    >
                                        {t("editor.removeLink")}
                                    </Button>
                                    <Button type="submit">{t("editor.apply")}</Button>
                                </div>
                            </form>
                        </Popover.Popup>
                    </Popover.Positioner>
                </Popover.Portal>
            </Popover.Root>
            {marks.table && (
                <Popover.Root>
                    <Popover.Trigger className="document-format-button" aria-label={t("editor.tableActions")}>
                        <Table2 className="size-4" />
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Positioner side="bottom" sideOffset={8} collisionPadding={12} className="document-overlay">
                            <Popover.Popup finalFocus={() => editor.view.dom} className="document-popover w-60">
                                <Popover.Title className="mb-2 px-2 text-xs font-medium text-tertiary">{t("editor.table")}</Popover.Title>
                                <div className="flex flex-col">
                                    {[
                                        ["editor.addRowAbove", () => editor.chain().focus().addRowBefore().run()],
                                        ["editor.addRowBelow", () => editor.chain().focus().addRowAfter().run()],
                                        ["editor.addColumnBefore", () => editor.chain().focus().addColumnBefore().run()],
                                        ["editor.addColumnAfter", () => editor.chain().focus().addColumnAfter().run()],
                                        ["editor.toggleHeaderRow", () => editor.chain().focus().toggleHeaderRow().run()],
                                        ["editor.deleteRow", () => editor.chain().focus().deleteRow().run()],
                                        ["editor.deleteColumn", () => editor.chain().focus().deleteColumn().run()],
                                        ["editor.deleteTable", () => editor.chain().focus().deleteTable().run()],
                                    ].map(([label, action]) => (
                                        <button
                                            key={String(label)}
                                            className="document-menu-item"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={action as () => void}
                                        >
                                            {t(String(label) as TranslationKey)}
                                        </button>
                                    ))}
                                </div>
                            </Popover.Popup>
                        </Popover.Positioner>
                    </Popover.Portal>
                </Popover.Root>
            )}
        </BubbleMenu>
    );
}
