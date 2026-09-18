import type { ComponentProps, FC, ReactNode } from "react";
import { isValidElement } from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";

type Orientation = "horizontal" | "vertical";
type TabType = "button-brand" | "button-gray" | "button-border" | "button-minimal" | "underline" | "line";

const sizes = {
    sm: { base: "text-sm font-semibold gap-1 *:data-icon:size-4", button: "py-2 px-2.5", underline: "px-0.5 pb-2.5 pt-0", line: "pl-2.5 pr-3 py-0.5" },
    md: { base: "text-md font-semibold gap-1.5 *:data-icon:size-5", button: "py-2.5 px-2.5", underline: "px-0.5 pb-2.5 pt-0", line: "pr-3.5 pl-3 py-1" },
};

const tabStyle = (type: TabType, active: boolean) => cx(
    "outline-focus-ring",
    type === "button-brand" && active && "bg-brand-primary_alt text-brand-secondary",
    type === "button-gray" && active && "bg-primary_hover text-secondary",
    type === "button-border" && active && "bg-primary_alt text-secondary shadow-sm",
    type === "button-minimal" && active && "bg-primary_alt text-secondary shadow-xs ring-1 ring-primary ring-inset",
    type === "underline" && "rounded-none border-b-2 border-transparent",
    type === "underline" && active && "border-fg-brand-primary_alt text-brand-secondary",
    type === "line" && "rounded-none border-l-2 border-transparent",
    type === "line" && active && "border-fg-brand-primary_alt text-brand-secondary",
);

interface TabListProps extends Omit<ComponentProps<typeof BaseTabs.List>, "children"> {
    size?: "sm" | "md";
    type?: TabType;
    orientation?: Orientation;
    items?: Array<{ id: string; children?: ReactNode; label?: ReactNode }>;
    fullWidth?: boolean;
    children?: ReactNode;
}

let TabConfigContext = (() => ({ size: "sm" as "sm" | "md", type: "button-brand" as TabType, fullWidth: false, orientation: "horizontal" as Orientation }))();

export const TabList = ({ size = "sm", type = "button-brand", orientation = "horizontal", fullWidth, items, children, className, ...props }: TabListProps) => {
    TabConfigContext = { size, type, fullWidth: Boolean(fullWidth), orientation };
    return (
        <BaseTabs.List {...props} className={(state) => cx("group flex", orientation === "vertical" && "w-max flex-col", type === "button-border" && "gap-1 rounded-[10px] bg-secondary_alt p-1 ring-1 ring-secondary ring-inset", type === "button-minimal" && "gap-0.5 rounded-lg bg-secondary_alt ring-1 ring-secondary ring-inset", type === "underline" && "relative gap-3 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border-secondary", fullWidth && "w-full", typeof className === "function" ? className(state) : className)}>
            {children ?? items?.map((item) => <Tab key={item.id} value={item.id} label={item.label ?? item.children}>{item.children ?? item.label}</Tab>)}
        </BaseTabs.List>
    );
};

export const TabPanel = ({ id, value, className, ...props }: Omit<ComponentProps<typeof BaseTabs.Panel>, "value"> & { id?: string; value?: string }) => (
    <BaseTabs.Panel {...props} value={value ?? id} className={(state) => cx("outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2", typeof className === "function" ? className(state) : className)} />
);

interface TabProps extends Omit<ComponentProps<typeof BaseTabs.Tab>, "children" | "value"> {
    id?: string;
    value?: string;
    label?: ReactNode;
    children?: ReactNode;
    icon?: FC<{ className?: string }> | ReactNode;
    badge?: number | string;
}

export const Tab = ({ id, value, label, children, badge, icon: Icon, className, ...props }: TabProps) => {
    const { size, type, fullWidth } = TabConfigContext;
    return (
        <BaseTabs.Tab {...props} value={value ?? id} className={(state) => cx("z-10 flex h-max cursor-pointer items-center justify-center gap-2 rounded-md whitespace-nowrap text-quaternary transition duration-100 ease-linear", fullWidth && "w-full flex-1", sizes[size].base, type === "underline" ? sizes[size].underline : type === "line" ? sizes[size].line : sizes[size].button, tabStyle(type, state.active), typeof className === "function" ? className(state) : className)}>
            {isValidElement(Icon) && Icon}
            {isReactComponent(Icon) && <Icon data-icon className="transition-inherit-all" />}
            <span className={cx("flex items-center gap-1.5", type !== "line" && "px-0.5")}>{children || label}{badge !== undefined && <Badge size="sm" type={type === "underline" || type === "line" || type === "button-brand" ? "pill-color" : "modern"} color={type === "underline" || type === "line" || type === "button-brand" ? "brand" : "gray"}>{badge}</Badge>}</span>
        </BaseTabs.Tab>
    );
};

interface TabsProps extends Omit<ComponentProps<typeof BaseTabs.Root>, "value" | "defaultValue" | "onValueChange" | "children"> {
    selectedKey?: string;
    defaultSelectedKey?: string;
    onSelectionChange?: (key: string) => void;
    className?: string;
    children?: ReactNode;
}

export const Tabs = ({ selectedKey, defaultSelectedKey, onSelectionChange, className, children, ...props }: TabsProps) => (
    <BaseTabs.Root {...props} value={selectedKey} defaultValue={defaultSelectedKey} onValueChange={(value) => onSelectionChange?.(String(value))} className={cx("flex w-full flex-col", className)}>{children}</BaseTabs.Root>
);

Tabs.Panel = TabPanel;
Tabs.List = TabList;
Tabs.Item = Tab;
