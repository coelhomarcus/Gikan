import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { TextSelection } from "@tiptap/pm/state";
import { type Editor, useEditorState } from "@tiptap/react";
import { GripVertical, Plus } from "lucide-react";
import { convertDocumentBlock } from "./block-conversion";
import { blockCommands } from "./editor-suggestions";

export function moveDocumentBlock(editor: Editor, position: number, direction: -1 | 1) {
    const blocks: { pos: number; size: number }[] = [];
    editor.state.doc.forEach((node, pos) => blocks.push({ pos, size: node.nodeSize }));
    const index = blocks.findIndex((block) => block.pos === position),
        target = blocks[index + direction];
    const node = editor.state.doc.nodeAt(position);
    if (!target || !node || index < 0) return;
    const insertion = direction < 0 ? target.pos : target.pos + target.size - node.nodeSize;
    const tr = editor.state.tr.delete(position, position + node.nodeSize).insert(insertion, node);
    tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(insertion + 1, tr.doc.content.size))));
    editor.view.dispatch(tr.scrollIntoView());
    editor.view.focus();
}

function BlockActions({ editor, position, onOpenChange }: { editor: Editor; position: number; onOpenChange: (open: boolean) => void }) {
    const [open, setOpen] = useState(false);
    const setMenuOpen = (value: boolean) => {
        setOpen(value);
        onOpenChange(value);
        editor.commands.setMeta("lockDragHandle", value);
    };
    const node = editor.state.doc.nodeAt(position);
    const add = () => {
        const end = position + (node?.nodeSize ?? 0);
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
            <button type="button" className="document-block-button" aria-label="Add block" onMouseDown={(event) => event.preventDefault()} onClick={add}>
                <Plus className="size-4" />
            </button>
            <Popover.Root open={open} onOpenChange={setMenuOpen}>
                <Popover.Trigger className="document-block-button" aria-label="Block actions">
                    <GripVertical className="size-4" />
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Positioner side="right" align="start" sideOffset={8} collisionPadding={12} className="document-overlay">
                        <Popover.Popup finalFocus={() => editor.view.dom} className="document-popover w-56">
                            <Popover.Title className="mb-2 px-2 text-xs font-medium text-tertiary">Block actions</Popover.Title>
                            <div className="flex flex-col" onClick={() => setMenuOpen(false)}>
                                <button className="document-menu-item" onClick={add}>
                                    Add block below
                                </button>
                                <button
                                    className="document-menu-item"
                                    onClick={() => {
                                        if (node)
                                            editor
                                                .chain()
                                                .focus()
                                                .insertContentAt(position + node.nodeSize, node.toJSON())
                                                .run();
                                    }}
                                >
                                    Duplicate
                                </button>
                                <button className="document-menu-item" disabled={position === 0} onClick={() => moveDocumentBlock(editor, position, -1)}>
                                    Move up
                                </button>
                                <button
                                    className="document-menu-item"
                                    disabled={!node || position + node.nodeSize === editor.state.doc.content.size}
                                    onClick={() => moveDocumentBlock(editor, position, 1)}
                                >
                                    Move down
                                </button>
                                <button
                                    className="document-menu-item text-danger-primary"
                                    onClick={() => {
                                        if (node)
                                            editor
                                                .chain()
                                                .focus()
                                                .deleteRange({ from: position, to: position + node.nodeSize })
                                                .run();
                                    }}
                                >
                                    Delete block
                                </button>
                                {node && !["image", "table", "horizontalRule"].includes(node.type.name) && (
                                    <>
                                        <p className="mt-2 border-t border-subtle px-2 py-2 text-xs text-tertiary">Turn into</p>
                                        {blockCommands.slice(0, 9).map((command) => (
                                            <button
                                                key={command.id}
                                                className="document-menu-item"
                                                onClick={() => {
                                                    convertDocumentBlock(editor, position, command.id);
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
    const [hoverPosition, setHoverPosition] = useState(0);
    const [open, setOpen] = useState(false);
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
                    if (!open && pos >= 0) setHoverPosition(pos);
                }}
            >
                <div className="flex items-center">
                    <BlockActions editor={editor} position={hoverPosition} onOpenChange={setOpen} />
                </div>
            </DragHandle>
            <div className="document-touch-controls flex items-center gap-1" aria-label="Current block">
                <BlockActions editor={editor} position={cursorPosition} onOpenChange={setOpen} />
            </div>
        </>
    );
}
