import { useEffect, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Image } from "@tiptap/extension-image";
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

function ImageBlock({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
    const [failed, setFailed] = useState(false);
    const [open, setOpen] = useState(!node.attrs.src);
    const [url, setUrl] = useState<string>(node.attrs.src ?? "");
    const [alt, setAlt] = useState<string>(node.attrs.alt ?? "");
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<number | null>(null);
    const resizeCleanup = useRef<(() => void) | null>(null);
    const hasCurrentNode = () => {
        if (editor.isDestroyed) return false;
        const position = getPos();
        return typeof position === "number" && editor.state.doc.nodeAt(position)?.type === node.type;
    };
    useEffect(() => setFailed(false), [node.attrs.src]);
    useEffect(() => () => resizeCleanup.current?.(), []);
    const width = Math.max(10, Math.min(100, Number(preview ?? node.attrs.widthPercent) || 100));
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
                        {failed ? "Image could not be loaded. Edit its URL to try again." : "Add an image using a URL"}
                    </div>
                )}
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
                        aria-label="Edit image"
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
                                <Popover.Title className="mb-3 text-sm font-medium">Image</Popover.Title>
                                <form
                                    className="space-y-3"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        if (!hasCurrentNode()) return;
                                        try {
                                            const parsed = new URL(url.trim());
                                            if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
                                        } catch {
                                            setError("Enter an HTTP or HTTPS image URL.");
                                            return;
                                        }
                                        updateAttributes({ src: url.trim(), alt });
                                        setFailed(false);
                                        setOpen(false);
                                    }}
                                >
                                    <Input label="Image URL" value={url} onChange={setUrl} placeholder="https://..." isInvalid={!!error} hint={error} />
                                    <Input label="Alternative text" value={alt} onChange={setAlt} />
                                    <Button type="submit">Apply image</Button>
                                </form>
                            </Popover.Popup>
                        </Popover.Positioner>
                    </Popover.Portal>
                </Popover.Root>
                <button
                    type="button"
                    role="slider"
                    aria-label="Image width"
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
                    onPointerDown={(event) => {
                        if (event.button !== 0 || !hasCurrentNode()) return;
                        event.preventDefault();
                        event.stopPropagation();
                        const control = event.currentTarget,
                            figure = control.parentElement!;
                        const containerWidth = figure.parentElement!.clientWidth,
                            startX = event.clientX,
                            startWidth = figure.clientWidth;
                        if (containerWidth <= 0) return;
                        let nextWidth = width;
                        const pointerId = event.pointerId;
                        control.setPointerCapture(pointerId);
                        let finish: (e: PointerEvent) => void = () => undefined;
                        let cancel: (e: PointerEvent) => void = () => undefined;
                        const move = (e: PointerEvent) => {
                            if (e.pointerId !== pointerId) return;
                            nextWidth = Math.max(10, Math.min(100, ((startWidth + e.clientX - startX) / containerWidth) * 100));
                            setPreview(nextWidth);
                        };
                        const cleanup = () => {
                            control.removeEventListener("pointermove", move);
                            control.removeEventListener("pointerup", finish);
                            control.removeEventListener("pointercancel", cancel);
                            control.removeEventListener("lostpointercapture", cancel);
                            if (control.hasPointerCapture(pointerId)) control.releasePointerCapture(pointerId);
                            if (resizeCleanup.current === cleanup) resizeCleanup.current = null;
                        };
                        finish = (e: PointerEvent) => {
                            if (e.pointerId !== pointerId) return;
                            cleanup();
                            if (hasCurrentNode()) updateAttributes({ widthPercent: nextWidth });
                            setPreview(null);
                        };
                        cancel = (e: PointerEvent) => {
                            if (e.pointerId !== pointerId) return;
                            cleanup();
                            setPreview(null);
                        };
                        control.addEventListener("pointermove", move);
                        control.addEventListener("pointerup", finish);
                        control.addEventListener("pointercancel", cancel);
                        control.addEventListener("lostpointercapture", cancel);
                        resizeCleanup.current?.();
                        resizeCleanup.current = cleanup;
                    }}
                    onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                />
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
