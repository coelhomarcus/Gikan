import { useEffect, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Image } from "@tiptap/extension-image";
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

function ImageBlock({ node, updateAttributes, selected, editor }: NodeViewProps) {
    const [failed, setFailed] = useState(false);
    const [open, setOpen] = useState(!node.attrs.src);
    const [url, setUrl] = useState<string>(node.attrs.src ?? "");
    const [alt, setAlt] = useState<string>(node.attrs.alt ?? "");
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<number | null>(null);
    useEffect(() => setFailed(false), [node.attrs.src]);
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
                    onKeyDown={(event) => {
                        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
                        event.preventDefault();
                        updateAttributes({ widthPercent: Math.max(10, Math.min(100, width + (event.key === "ArrowRight" ? 5 : -5))) });
                    }}
                    onPointerDown={(event) => {
                        event.preventDefault();
                        const control = event.currentTarget,
                            figure = control.parentElement!;
                        const containerWidth = figure.parentElement!.clientWidth,
                            startX = event.clientX,
                            startWidth = figure.clientWidth;
                        let nextWidth = width;
                        control.setPointerCapture(event.pointerId);
                        const move = (e: PointerEvent) => {
                            nextWidth = Math.max(10, Math.min(100, ((startWidth + e.clientX - startX) / containerWidth) * 100));
                            setPreview(nextWidth);
                        };
                        const end = () => {
                            control.removeEventListener("pointermove", move);
                            control.removeEventListener("pointerup", end);
                            control.removeEventListener("pointercancel", end);
                            updateAttributes({ widthPercent: nextWidth });
                            setPreview(null);
                        };
                        control.addEventListener("pointermove", move);
                        control.addEventListener("pointerup", end);
                        control.addEventListener("pointercancel", end);
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
        return ReactNodeViewRenderer(ImageBlock);
    },
}).configure({ allowBase64: false });
