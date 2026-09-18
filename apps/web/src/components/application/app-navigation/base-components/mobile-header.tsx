import type { PropsWithChildren } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { GikanLogo } from "@/components/foundations/logo/gikan-logo";
import { AppIcons } from "@/components/foundations/icons";

export const MobileNavigationHeader = ({ children }: PropsWithChildren) => (
    <Dialog.Root>
        <header className="flex h-14 items-center justify-between border-b border-secondary bg-primary p-3 pl-4 lg:hidden">
            <GikanLogo className="h-6" />
            <Dialog.Trigger render={<button type="button" aria-label="Expand navigation menu" className="group flex size-9 items-center justify-center rounded-md bg-primary text-fg-secondary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2" />}>
                <AppIcons.Menu className="size-4 group-aria-expanded:opacity-0" />
                <AppIcons.Close className="absolute size-4 opacity-0 group-aria-expanded:opacity-100" />
            </Dialog.Trigger>
        </header>
        <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 cursor-pointer bg-overlay/70 pr-16 backdrop-blur-md lg:hidden" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex lg:hidden">
                <Dialog.Popup className="relative w-full max-w-74 cursor-auto bg-primary shadow-xl">
                    <Dialog.Close render={<button type="button" aria-label="Close navigation menu" className="fixed top-2 right-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-md text-fg-white/70 outline-focus-ring hover:bg-white/10 hover:text-fg-white focus-visible:outline-2 focus-visible:outline-offset-2" />}>
                        <AppIcons.Close className="size-4" />
                    </Dialog.Close>
                    <div className="h-dvh overflow-y-auto">{children}</div>
                </Dialog.Popup>
            </Dialog.Viewport>
        </Dialog.Portal>
    </Dialog.Root>
);
