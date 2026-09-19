/**
 * State SVG geometry and priority icon mapping adapted from Plane 01064a7,
 * packages/propel/src/icons/state and priority-icon.tsx.
 * Copyright (c) 2023-present Plane Software, Inc. and contributors.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SignalHigh, SignalMedium, SignalLow } from "lucide-react";
import { CyclesOutline } from "@makeplane/propel/icons";

/** State groups are presentation only; Gikan continues to store project columns. */
export function StateIcon({ name, color, className = "size-3.5" }: { name: string; color?: string | null; className?: string }) {
    const state = name.toLowerCase();
    return <svg viewBox="0 0 16 16" fill="none" className={className} style={{ color: color ?? "#60646c" }} aria-hidden="true">
        {state.includes("backlog") ? <g>{Array.from({ length: 15 }, (_, i) => <g key={i} transform={`translate(8 8) rotate(${i * 24 - 90})`}><line x1="5.75" y1="0" x2="6.5" y2="0" stroke="currentColor" strokeWidth="1.21" strokeLinecap="round" /></g>)}</g>
            : state.includes("done") || state.includes("complete") ? <path fillRule="evenodd" clipRule="evenodd" d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15ZM11.3587 6.18828C11.6007 5.85214 11.5244 5.38343 11.1882 5.14141C10.8521 4.89938 10.3834 4.97568 10.1414 5.31183L7.03706 9.62335L5.25956 7.97751C4.95563 7.69609 4.4811 7.71434 4.19968 8.01828C3.91826 8.32221 3.93651 8.79673 4.24045 9.07815L6.64045 11.3004C6.79816 11.4464 7.01095 11.5178 7.22481 11.4963C7.43868 11.4749 7.63307 11.3627 7.75865 11.1883L11.3587 6.18828Z" fill="currentColor" />
            : <><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />{state.includes("progress") && <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />}</>}
    </svg>;
}

export function PriorityIcon({ priority, withContainer = false }: { priority: string; withContainer?: boolean }) {
    const Icon = priority === "high" ? SignalHigh : priority === "medium" ? SignalMedium : SignalLow;
    const icon = <Icon size={14} aria-hidden="true" style={{ color: `var(--priority-${priority})`, transform: withContainer ? `translateX(${priority === "high" ? 1 : priority === "medium" ? 2 : 4}px)` : undefined }} />;
    return withContainer ? <span title={`${priority} priority`} className="flex size-5 shrink-0 items-center justify-center rounded-sm border bg-layer-2 p-0.5" style={{ borderColor: `var(--priority-${priority})` }}>{icon}</span> : icon;
}

export function IssueAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
    return <span title={name} className="inline-flex size-[18px] shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] text-white" style={{ backgroundColor: "#92346f" }}>
        {avatarUrl ? <img src={avatarUrl} alt={name} className="size-full object-cover" /> : name.charAt(0).toUpperCase()}
    </span>;
}

export const CycleIcon = CyclesOutline;
