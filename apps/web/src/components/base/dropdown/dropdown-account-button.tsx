import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown, ChevronRight, HelpCircle, LogOut01, Moon01, Plus, Settings01, User01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";

const itemClass = "flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold text-secondary outline-hidden hover:bg-layer-1-hover data-highlighted:bg-layer-1-hover";

export const DropdownAccountButton = () => {
    const [darkMode, setDarkMode] = useState(true);
    const [account, setAccount] = useState("olivia");

    return (
        <Menu.Root>
            <Menu.Trigger render={<Button size="sm" className="group" color="secondary" iconTrailing={(props) => <ChevronDown data-icon="inline-end" {...props} className="size-4! stroke-[2.25px]!" />}>Account</Button>} />
            <Menu.Portal>
                <Menu.Positioner align="end" sideOffset={4}>
                    <Menu.Popup className="z-50 w-60 rounded-lg bg-surface-1 p-1 shadow-lg ring-1 ring-secondary_alt">
                        <Menu.Item className={itemClass}><User01 className="size-4 text-placeholder" />View profile<span className="ml-auto text-xs text-placeholder">⌘K→P</span></Menu.Item>
                        <Menu.Item className={itemClass}><Settings01 className="size-4 text-placeholder" />Settings<span className="ml-auto text-xs text-placeholder">⌘S</span></Menu.Item>
                        <Menu.CheckboxItem checked={darkMode} onCheckedChange={(checked) => setDarkMode(checked)} className={itemClass}>
                            <Menu.CheckboxItemIndicator className="flex size-4 items-center justify-center text-accent-primary">{darkMode ? "✓" : ""}</Menu.CheckboxItemIndicator>
                            <Moon01 className="size-4 text-placeholder" />Dark mode
                        </Menu.CheckboxItem>
                        <Menu.SubmenuRoot>
                            <Menu.SubmenuTrigger className={itemClass}><HelpCircle className="size-4 text-placeholder" />Support<ChevronRight className="ml-auto size-4 text-placeholder" /></Menu.SubmenuTrigger>
                            <Menu.Portal>
                                <Menu.Positioner side="right" align="start" sideOffset={-4}>
                                    <Menu.Popup className="z-50 w-48 rounded-lg bg-surface-1 p-1 shadow-lg ring-1 ring-secondary_alt">
                                        <Menu.Item className={itemClass}>Help center</Menu.Item>
                                        <Menu.Item className={itemClass}>Contact support</Menu.Item>
                                        <Menu.Item className={itemClass}>Send feedback</Menu.Item>
                                    </Menu.Popup>
                                </Menu.Positioner>
                            </Menu.Portal>
                        </Menu.SubmenuRoot>
                        <div className="my-1 h-px bg-border-secondary" />
                        <p className="px-2.5 py-1 text-xs font-semibold text-accent-primary">Switch Account</p>
                        <Menu.RadioGroup value={account} onValueChange={(value) => setAccount(String(value))}>
                            <Menu.RadioItem value="olivia" className={itemClass}><span className={cx("flex size-4 items-center justify-center rounded-full border", account === "olivia" && "border-accent-strong bg-brand text-white")}>{account === "olivia" ? "•" : ""}</span><Avatar aria-hidden size="xs" src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80" alt="Olivia Rhye" className="size-5" />Olivia Rhye</Menu.RadioItem>
                            <Menu.RadioItem value="sienna" className={itemClass}><span className={cx("flex size-4 items-center justify-center rounded-full border", account === "sienna" && "border-accent-strong bg-brand text-white")}>{account === "sienna" ? "•" : ""}</span><Avatar aria-hidden size="xs" src="https://www.untitledui.com/images/avatars/sienna-hewett?fm=webp&q=80" alt="Sienna Hewitt" className="size-5" />Sienna Hewitt</Menu.RadioItem>
                        </Menu.RadioGroup>
                        <Menu.Item className={itemClass}><Plus className="size-4 text-placeholder" />Add account</Menu.Item>
                        <div className="mt-1 border-t border-subtle p-2"><Button size="xs" color="secondary" iconLeading={LogOut01} className="w-full justify-center">Sign out</Button></div>
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
};
