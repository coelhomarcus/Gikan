import { Popover } from "@base-ui/react/popover";
import { ColumnColorPicker } from "@/features/board/components/column-color-picker";

export function SettingColorPicker({ value, onChange, isDisabled }: { value: string | null; onChange: (color: string) => void; isDisabled?: boolean }) {
    return (
        <Popover.Root>
            <Popover.Trigger
                disabled={isDisabled}
                aria-label="Choose color"
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-subtle bg-surface-1 outline-accent-strong hover:bg-layer-1-hover disabled:opacity-50"
            >
                <span className="size-3 rounded-full" style={{ backgroundColor: value ?? "#87888c" }} />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner sideOffset={8} className="z-50">
                    <Popover.Popup className="w-60 rounded-md border border-subtle bg-layer-2 p-3 shadow-overlay-200 outline-none">
                        <Popover.Title className="mb-3 text-sm font-medium">Color</Popover.Title>
                        <ColumnColorPicker label="" value={value} onChange={onChange} />
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
