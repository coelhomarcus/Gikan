import type { EntityCover } from "@gikan/shared";
import { useEffect, useState } from "react";
import { cx } from "@/utils/cx";

interface CoverImageProps {
    cover: EntityCover | null | undefined;
    alt?: string;
    className?: string;
    imageClassName?: string;
}

/** Keeps a stable neutral surface when a remote cover is absent or cannot be rendered. */
export function CoverImage({ cover, alt = "", className, imageClassName }: CoverImageProps) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [cover?.url]);
    return (
        <div className={cx("overflow-hidden bg-surface-2", className)}>
            {cover && !failed && (
                <img
                    src={cover.url}
                    alt={alt}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    onError={() => setFailed(true)}
                    className={cx("size-full object-cover", imageClassName)}
                    style={{ objectPosition: `${cover.position.x}% ${cover.position.y}%` }}
                />
            )}
        </div>
    );
}
