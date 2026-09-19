import { useEffect, useId, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { type Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Code2, Italic, Link2, Strikethrough, Table2 } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

export function DocumentFormatMenu({ editor }: { editor: Editor }) {
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
                { label: "Bold", Icon: Bold, active: marks.bold, action: () => editor.chain().focus().toggleBold().run() },
                { label: "Italic", Icon: Italic, active: marks.italic, action: () => editor.chain().focus().toggleItalic().run() },
                { label: "Strikethrough", Icon: Strikethrough, active: marks.strike, action: () => editor.chain().focus().toggleStrike().run() },
                { label: "Inline code", Icon: Code2, active: marks.code, action: () => editor.chain().focus().toggleCode().run() },
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
                <Popover.Trigger className="document-format-button" aria-label="Edit link">
                    <Link2 className="size-4" />
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Positioner side="bottom" sideOffset={8} collisionPadding={12} className="document-overlay">
                        <Popover.Popup finalFocus={() => editor.view.dom} className="document-popover w-72">
                            <Popover.Title className="mb-3 text-sm font-medium">Link</Popover.Title>
                            <form
                                className="space-y-3"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (!/^(https?:\/\/|mailto:)/i.test(url.trim())) {
                                        setError("Use an HTTP, HTTPS, or email link.");
                                        return;
                                    }
                                    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
                                    setLinkOpen(false);
                                }}
                            >
                                <Input id={id} label="Link URL" value={url} onChange={setUrl} isInvalid={!!error} hint={error} autoFocus />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        color="tertiary"
                                        onClick={() => {
                                            editor.chain().focus().extendMarkRange("link").unsetLink().run();
                                            setLinkOpen(false);
                                        }}
                                    >
                                        Remove
                                    </Button>
                                    <Button type="submit">Apply</Button>
                                </div>
                            </form>
                        </Popover.Popup>
                    </Popover.Positioner>
                </Popover.Portal>
            </Popover.Root>
            {marks.table && (
                <Popover.Root>
                    <Popover.Trigger className="document-format-button" aria-label="Table actions">
                        <Table2 className="size-4" />
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Positioner side="bottom" sideOffset={8} collisionPadding={12} className="document-overlay">
                            <Popover.Popup finalFocus={() => editor.view.dom} className="document-popover w-60">
                                <Popover.Title className="mb-2 px-2 text-xs font-medium text-tertiary">Table</Popover.Title>
                                <div className="flex flex-col">
                                    {[
                                        ["Add row above", () => editor.chain().focus().addRowBefore().run()],
                                        ["Add row below", () => editor.chain().focus().addRowAfter().run()],
                                        ["Add column before", () => editor.chain().focus().addColumnBefore().run()],
                                        ["Add column after", () => editor.chain().focus().addColumnAfter().run()],
                                        ["Toggle header row", () => editor.chain().focus().toggleHeaderRow().run()],
                                        ["Delete row", () => editor.chain().focus().deleteRow().run()],
                                        ["Delete column", () => editor.chain().focus().deleteColumn().run()],
                                        ["Delete table", () => editor.chain().focus().deleteTable().run()],
                                    ].map(([label, action]) => (
                                        <button
                                            key={String(label)}
                                            className="document-menu-item"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={action as () => void}
                                        >
                                            {String(label)}
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
