import type { FC, HTMLAttributes } from "react";
import { Popover } from "@base-ui/react/popover";
import { BookOpen, ChevronsUpDown, LogOut, Plus, Settings, User } from "lucide-react";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Button } from "@/components/base/buttons/button";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cx } from "@/utils/cx";

export type NavAccountType = { id: string; name: string; email: string; avatar: string; status: "online" | "offline" };
const placeholderAccounts: NavAccountType[] = [
    { id: "caitlyn", name: "Caitlyn King", email: "caitlyn@untitledui.com", avatar: "https://www.untitledui.com/images/avatars/caitlyn-king?fm=webp&q=80", status: "online" },
    { id: "sienna", name: "Sienna Hewitt", email: "sienna@untitledui.com", avatar: "https://www.untitledui.com/images/avatars/transparent/sienna-hewitt?bg=%23E0E0E0", status: "online" },
];

export const NavAccountMenu = ({ className, selectedAccountId = "olivia", accounts = placeholderAccounts }: { className?: string; accounts?: NavAccountType[]; selectedAccountId?: string }) => (
    <div className={cx("w-66 rounded-xl bg-secondary_alt p-1 shadow-lg ring-1 ring-secondary_alt", className)}>
        <div className="rounded-xl bg-primary ring-1 ring-secondary">
            <div className="flex flex-col gap-0.5 py-1.5"><NavAccountCardMenuItem label="View profile" icon={User} shortcut="⌘K→P" /><NavAccountCardMenuItem label="Account settings" icon={Settings} shortcut="⌘S" /><NavAccountCardMenuItem label="Documentation" icon={BookOpen} /></div>
            <div className="flex flex-col gap-0.5 border-t border-secondary py-1.5"><div className="px-3 pt-1.5 pb-1 text-xs font-semibold text-tertiary">Switch account</div><div className="flex flex-col gap-0.5 px-1.5">{accounts.map((account) => <button type="button" key={account.id} className={cx("relative w-full cursor-pointer rounded-md px-2 py-1.5 text-left hover:bg-primary_hover", account.id === selectedAccountId && "bg-primary_hover")}><AvatarLabelGroup status={account.status} size="md" src={account.avatar} title={account.name} subtitle={account.email} /><RadioButtonBase isSelected={account.id === selectedAccountId} className="absolute top-2 right-2" /></button>)}</div></div>
            <div className="flex flex-col gap-2 px-2 pt-0.5 pb-2"><Button iconLeading={Plus} color="secondary" size="sm">Add account</Button></div>
        </div>
        <div className="pt-1 pb-1.5"><NavAccountCardMenuItem label="Sign out" icon={LogOut} shortcut="⌥⇧Q" /></div>
    </div>
);

const NavAccountCardMenuItem = ({ icon: Icon, label, shortcut, ...buttonProps }: { icon?: FC<{ className?: string }>; label: string; shortcut?: string } & HTMLAttributes<HTMLButtonElement>) => <button type="button" {...buttonProps} className={cx("group/item w-full cursor-pointer px-1.5 focus:outline-hidden", buttonProps.className)}><span className="flex w-full items-center justify-between gap-3 rounded-md p-2 group-hover/item:bg-primary_hover"><span className="flex gap-2 text-sm font-semibold text-secondary group-hover/item:text-secondary_hover">{Icon && <Icon className="size-5 text-fg-quaternary" />}{label}</span>{shortcut && <kbd className="rounded px-1 py-px font-body text-xs font-medium text-tertiary ring-1 ring-secondary ring-inset">{shortcut}</kbd>}</span></button>;

export const NavAccountCard = ({ popoverPlacement, selectedAccountId = "caitlyn", items = placeholderAccounts, avatarRounded }: { popoverPlacement?: string; selectedAccountId?: string; items?: NavAccountType[]; avatarRounded?: boolean }) => {
    const isDesktop = useBreakpoint("lg");
    const selectedAccount = items.find((account) => account.id === selectedAccountId);
    if (!selectedAccount) return null;
    const side = (popoverPlacement?.split(" ")[0] ?? (isDesktop ? "right" : "top")) as "top" | "bottom" | "left" | "right";
    return <div className="relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset"><AvatarLabelGroup size="md" src={selectedAccount.avatar} title={selectedAccount.name} subtitle={selectedAccount.email} status={selectedAccount.status} rounded={avatarRounded} /><Popover.Root><Popover.Trigger render={<button type="button" aria-label="Switch account" className="absolute top-2 right-2 flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover" />}><ChevronsUpDown className="size-4 shrink-0" /></Popover.Trigger><Popover.Portal><Popover.Positioner side={side} sideOffset={8}><Popover.Popup><NavAccountMenu selectedAccountId={selectedAccountId} accounts={items} /></Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root></div>;
};
