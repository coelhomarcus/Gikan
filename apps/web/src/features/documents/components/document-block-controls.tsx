import { useEffect, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { TextSelection, type Transaction } from "@tiptap/pm/state";
import { type Editor, useEditorState } from "@tiptap/react";
import { GripVertical, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { convertDocumentBlock } from "./block-conversion";
import { filterBlockCommands } from "./editor-suggestions";

function getTopLevelBlock(editor: Editor, position: number) {
    if (!Number.isInteger(position) || position < 0 || position >= editor.state.doc.content.size) return null;
    let pos = 0;
    for (let index = 0; index < editor.state.doc.childCount; index++) {
        const node = editor.state.doc.child(index);
        if (pos === position) return { pos, node };
        pos += node.nodeSize;
    }
    return null;
}

export function moveDocumentBlock(editor: Editor, position: number, direction: -1 | 1) {
    const blocks: { pos: number; size: number }[] = [];
    editor.state.doc.forEach((node, pos) => blocks.push({ pos, size: node.nodeSize }));
    const index = blocks.findIndex((block) => block.pos === position),
        target = blocks[index + direction];
    const current = getTopLevelBlock(editor, position),
        node = current?.node;
    if (!target || !node || index < 0) return;
    const insertion = direction < 0 ? target.pos : target.pos + target.size - node.nodeSize;
    const tr = editor.state.tr.delete(position, position + node.nodeSize).insert(insertion, node);
    if (insertion < 0 || insertion + 1 > tr.doc.content.size) return;
    tr.setSelection(TextSelection.near(tr.doc.resolve(insertion + 1)));
    editor.view.dispatch(tr.scrollIntoView());
    editor.view.focus();
}

function BlockActions({
    editor,
    position,
    getPosition,
    onOpenChange,
}: {
    editor: Editor;
    position: number;
    getPosition: () => number;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const setMenuOpen = (value: boolean) => {
        setOpen(value);
        onOpenChange(value);
        editor.commands.setMeta("lockDragHandle", value);
    };
    const currentPosition = getPosition;
    const getNode = () => getTopLevelBlock(editor, currentPosition())?.node;
    const node = getNode();
    const add = () => {
        const node = getNode();
        if (!node) return;
        const end = currentPosition() + node.nodeSize;
        editor
            .chain()
            .focus()
            .insertContentAt(end, { type: "paragraph" })
            .setTextSelection(end + 1)
            .insertContent("/")
            .run();
    };
    return (
        <>
            <button type="button" className="document-block-button" aria-label={t("editor.addBlock")} onMouseDown={(event) => event.preventDefault()} onClick={add}>
                <Plus className="size-4" />
            </button>
            <Popover.Root open={open} onOpenChange={setMenuOpen}>
                <Popover.Trigger className="document-block-button" aria-label={t("editor.blockActions")}>
                    <GripVertical className="size-4" />
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Positioner side="right" align="start" sideOffset={8} collisionPadding={12} className="document-overlay">
                        <Popover.Popup finalFocus={() => editor.view.dom} className="document-popover w-56">
                            <Popover.Title className="mb-2 px-2 text-xs font-medium text-tertiary">{t("editor.blockActions")}</Popover.Title>
                            <div className="flex flex-col" onClick={() => setMenuOpen(false)}>
                                <button className="document-menu-item" onClick={add}>
                                    {t("editor.addBlockBelow")}
                                </button>
                                <button
                                    className="document-menu-item"
                                    onClick={() => {
                                        const node = getNode();
                                        if (node)
                                            editor
                                                .chain()
                                                .focus()
                                                .insertContentAt(currentPosition() + node.nodeSize, node.toJSON())
                                                .run();
                                    }}
                                >
                                    {t("editor.duplicate")}
                                </button>
                                <button
                                    className="document-menu-item"
                                    disabled={position === 0}
                                    onClick={() => moveDocumentBlock(editor, currentPosition(), -1)}
                                >
                                    {t("editor.moveUp")}
                                </button>
                                <button
                                    className="document-menu-item"
                                    disabled={!node || position + node.nodeSize === editor.state.doc.content.size}
                                    onClick={() => moveDocumentBlock(editor, currentPosition(), 1)}
                                >
                                    {t("editor.moveDown")}
                                </button>
                                <button
                                    className="document-menu-item text-danger-primary"
                                    onClick={() => {
                                        const currentNode = getNode();
                                        if (currentNode)
                                            editor
                                                .chain()
                                                .focus()
                                                .deleteRange({ from: currentPosition(), to: currentPosition() + currentNode.nodeSize })
                                                .run();
                                    }}
                                >
                                    {t("editor.deleteBlock")}
                                </button>
                                {node && !["image", "table", "horizontalRule"].includes(node.type.name) && (
                                    <>
                                        <p className="mt-2 border-t border-subtle px-2 py-2 text-xs text-tertiary">{t("editor.turnInto")}</p>
                                        {filterBlockCommands("").slice(0, 9).map((command) => (
                                            <button
                                                key={command.id}
                                                className="document-menu-item"
                                                onClick={() => {
                                                    convertDocumentBlock(editor, currentPosition(), command.id);
                                                }}
                                            >
                                                {command.label}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        </Popover.Popup>
                    </Popover.Positioner>
                </Popover.Portal>
            </Popover.Root>
        </>
    );
}

export function DocumentBlockControls({ editor }: { editor: Editor }) {
    const [hoverPosition, setHoverPosition] = useState(-1);
    const hoverPositionRef = useRef(-1);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const onTransaction = ({ transaction }: { transaction: Transaction }) => {
            if (!transaction.docChanged || hoverPositionRef.current < 0) return;
            const mapped = transaction.mapping.mapResult(hoverPositionRef.current, 1);
            const next = mapped.deleted || mapped.deletedAcross ? null : getTopLevelBlock(editor, mapped.pos);
            const position = next?.pos ?? -1;
            hoverPositionRef.current = position;
            setHoverPosition(position);
        };
        editor.on("transaction", onTransaction);
        return () => {
            editor.off("transaction", onTransaction);
        };
    }, [editor]);
    const updateHoverPosition = (position: number) => {
        hoverPositionRef.current = position;
        setHoverPosition(position);
    };
    const cursorPosition = useEditorState({
        editor,
        selector: ({ editor: current }) => (current.state.selection.$from.depth ? current.state.selection.$from.before(1) : current.state.selection.from),
    });
    return (
        <>
            <DragHandle
                editor={editor}
                className="document-drag-handle"
                computePositionConfig={{ placement: "left-start", strategy: "absolute" }}
                onNodeChange={({ pos }) => {
                    if (open) return;
                    const block = getTopLevelBlock(editor, pos);
                    updateHoverPosition(block?.pos ?? -1);
                }}
            >
                {hoverPosition >= 0 && (
                    <div className="flex items-center">
                        <BlockActions editor={editor} position={hoverPosition} getPosition={() => hoverPositionRef.current} onOpenChange={setOpen} />
                    </div>
                )}
            </DragHandle>
            <div className="document-touch-controls flex items-center gap-1" aria-label={t("editor.currentBlock")}>
                <BlockActions
                    editor={editor}
                    position={cursorPosition}
                    getPosition={() => {
                        const selection = editor.state.selection.$from;
                        return selection.depth ? selection.before(1) : selection.pos;
                    }}
                    onOpenChange={setOpen}
                />
            </div>
        </>
    );
}
