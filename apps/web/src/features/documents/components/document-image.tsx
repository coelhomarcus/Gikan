import { useEffect, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Image } from "@tiptap/extension-image";
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useTranslation } from "react-i18next";

function ImageBlock({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
    const { t } = useTranslation();
    const [failed, setFailed] = useState(false);
    const [open, setOpen] = useState(!node.attrs.src);
    const [url, setUrl] = useState<string>(node.attrs.src ?? "");
    const [alt, setAlt] = useState<string>(node.attrs.alt ?? "");
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<number | null>(null);
    const resize = useRef<{ pointerId: number; cleanup: () => void } | null>(null);
    const resizeControl = useRef<HTMLButtonElement>(null);
    const hasCurrentNode = () => {
        if (editor.isDestroyed) return false;
        const position = getPos();
        return typeof position === "number" && editor.state.doc.nodeAt(position)?.type === node.type;
    };
    const width = Math.max(10, Math.min(100, Number(preview ?? node.attrs.widthPercent) || 100));
    useEffect(() => setFailed(false), [node.attrs.src]);
    useEffect(() => () => resize.current?.cleanup(), []);
    useEffect(() => {
        const control = resizeControl.current;
        if (!control) return;
        const begin = (event: PointerEvent) => {
            // The node's ProseMirror position can be recalculated while it receives focus.
            // Start from this mounted control and verify the node again only when committing.
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            const figure = control.parentElement;
            if (!figure) return;
            const containerWidth = figure.parentElement?.clientWidth ?? 0,
                startX = event.clientX,
                startWidth = figure.clientWidth;
            if (containerWidth <= 0) return;
            resize.current?.cleanup();
            let nextWidth = width;
            const pointerId = event.pointerId;
            const move = (pointerEvent: PointerEvent) => {
                if (pointerEvent.pointerId !== pointerId) return;
                pointerEvent.preventDefault();
                nextWidth = Math.max(10, Math.min(100, ((startWidth + pointerEvent.clientX - startX) / containerWidth) * 100));
                setPreview(nextWidth);
            };
            const cleanup = () => {
                window.removeEventListener("pointermove", move, true);
                window.removeEventListener("pointerup", finish, true);
                window.removeEventListener("pointercancel", cancel, true);
                if (control.hasPointerCapture(pointerId)) control.releasePointerCapture(pointerId);
                if (resize.current?.pointerId === pointerId) resize.current = null;
            };
            const finish = (pointerEvent: PointerEvent) => {
                if (pointerEvent.pointerId !== pointerId) return;
                cleanup();
                if (hasCurrentNode()) updateAttributes({ widthPercent: nextWidth });
                setPreview(null);
            };
            const cancel = (pointerEvent: PointerEvent) => {
                if (pointerEvent.pointerId !== pointerId) return;
                cleanup();
                setPreview(null);
            };
            resize.current = { pointerId, cleanup };
            control.setPointerCapture(pointerId);
            window.addEventListener("pointermove", move, true);
            window.addEventListener("pointerup", finish, true);
            window.addEventListener("pointercancel", cancel, true);
        };
        control.addEventListener("pointerdown", begin);
        return () => control.removeEventListener("pointerdown", begin);
    }, [editor, getPos, node.type, updateAttributes, width]);
    return (
        <NodeViewWrapper className="document-image group" contentEditable={false} data-selected={selected || undefined}>
            <figure className="relative" style={{ width: `${width}%` }}>
                {node.attrs.src && !failed ? (
                    <img
                        src={node.attrs.src}
                        alt={node.attrs.alt || ""}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        onError={() => setFailed(true)}
                        className="block h-auto w-full rounded-md"
                    />
                ) : (
                    <div className="flex min-h-32 items-center justify-center gap-2 rounded-md border border-dashed border-strong bg-layer-1 px-4 text-sm text-tertiary">
                        <ImageIcon className="size-5" />
                        {failed ? t("editor.imageCouldNotLoad") : t("editor.addImageUrl")}
                    </div>
                )}
                {editor.isEditable && <>
                <Popover.Root
                    open={open}
                    onOpenChange={(value) => {
                        setOpen(value);
                        if (value) {
                            setUrl(node.attrs.src ?? "");
                            setAlt(node.attrs.alt ?? "");
                            setError("");
                        }
                    }}
                >
                    <Popover.Trigger
                        className="shadow-sm absolute top-2 right-2 flex size-7 items-center justify-center rounded-md border border-subtle bg-layer-2 text-secondary"
                        aria-label={t("editor.editImage")}
                        data-node-view-control=""
                        onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                        }}
                    >
                        <Pencil className="size-4" />
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={12} className="document-overlay">
                            <Popover.Popup finalFocus={() => editor.view.dom} className="document-popover w-80">
                                <Popover.Title className="mb-3 text-sm font-medium">{t("editor.image")}</Popover.Title>
                                <form
                                    className="space-y-3"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        if (!hasCurrentNode()) return;
                                        try {
                                            const parsed = new URL(url.trim());
                                            if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
                                        } catch {
                                            setError(t("editor.enterImageUrl"));
                                            return;
                                        }
                                        updateAttributes({ src: url.trim(), alt });
                                        setFailed(false);
                                        setOpen(false);
                                    }}
                                >
                                    <Input label={t("editor.imageUrl")} value={url} onChange={setUrl} placeholder="https://..." isInvalid={!!error} hint={error} />
                                    <Input label={t("editor.altText")} value={alt} onChange={setAlt} />
                                    <Button type="submit">{t("editor.applyImage")}</Button>
                                </form>
                            </Popover.Popup>
                        </Popover.Positioner>
                    </Popover.Portal>
                </Popover.Root>
                <button
                    ref={resizeControl}
                    type="button"
                    role="slider"
                    aria-label={t("editor.imageWidth")}
                    aria-valuemin={10}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(width)}
                    className="document-image-resize"
                    data-node-view-control=""
                    onKeyDown={(event) => {
                        if (!["ArrowLeft", "ArrowRight"].includes(event.key) || !hasCurrentNode()) return;
                        event.preventDefault();
                        updateAttributes({ widthPercent: Math.max(10, Math.min(100, width + (event.key === "ArrowRight" ? 5 : -5))) });
                    }}
                    onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                />
                </>}
            </figure>
        </NodeViewWrapper>
    );
}
export const DocumentImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            widthPercent: {
                default: 100,
                parseHTML: (element) => Number(element.getAttribute("data-width-percent")) || 100,
                renderHTML: (attrs) => ({ "data-width-percent": attrs.widthPercent }),
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ImageBlock, {
            stopEvent: ({ event }) => event.target instanceof Element && event.target.closest("[data-node-view-control]") !== null,
        });
    },
}).configure({ allowBase64: false });
