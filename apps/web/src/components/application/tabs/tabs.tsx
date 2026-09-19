import { createContext, isValidElement, useContext } from "react";
import type { ComponentProps, FC, ReactNode } from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";

type Orientation = "horizontal" | "vertical";
type TabType = "button-brand" | "button-gray" | "button-border" | "button-minimal" | "underline" | "line";

const sizes = {
    sm: { base: "h-8 gap-2 text-sm font-semibold *:data-icon:size-4", button: "px-3", underline: "h-9 px-3", line: "h-8 px-3" },
    md: { base: "h-9 gap-2 text-md font-semibold *:data-icon:size-4", button: "px-3", underline: "h-10 px-3", line: "h-9 px-3" },
};

const tabStyle = (type: TabType, active: boolean) => cx(
    "outline-accent-strong",
    type === "button-brand" && active && "bg-brand-primary_alt text-accent-primary",
    type === "button-gray" && active && "bg-layer-1-hover text-secondary",
    type === "button-border" && active && "bg-surface-1 text-secondary shadow-sm",
    type === "button-minimal" && active && "bg-surface-1 text-secondary shadow-xs ring-1 ring-strong ring-inset",
    type === "underline" && "rounded-none border-b-2 border-transparent",
    type === "underline" && active && "border-fg-brand-primary_alt text-accent-primary",
    type === "line" && "rounded-none border-l-2 border-transparent",
    type === "line" && active && "border-fg-brand-primary_alt text-accent-primary",
);

interface TabListProps extends Omit<ComponentProps<typeof BaseTabs.List>, "children"> {
    size?: "sm" | "md";
    type?: TabType;
    orientation?: Orientation;
    items?: Array<{ id: string; children?: ReactNode; label?: ReactNode }>;
    fullWidth?: boolean;
    children?: ReactNode;
}

const TabConfigContext = createContext({
    size: "sm" as "sm" | "md",
    type: "button-brand" as TabType,
    fullWidth: false,
    orientation: "horizontal" as Orientation,
});

export const TabList = ({ size = "sm", type = "button-brand", orientation = "horizontal", fullWidth, items, children, className, ...props }: TabListProps) => {
    return (
        <TabConfigContext.Provider value={{ size, type, fullWidth: Boolean(fullWidth), orientation }}>
            <BaseTabs.List {...props} className={(state) => cx("group flex", orientation === "vertical" && "w-max flex-col", type === "button-border" && "gap-1 rounded-lg bg-surface-2 p-1 ring-1 ring-subtle ring-inset", type === "button-minimal" && "gap-1 rounded-lg bg-surface-2 ring-1 ring-subtle ring-inset", type === "underline" && "relative gap-4 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border-secondary", fullWidth && "w-full", typeof className === "function" ? className(state) : className)}>
                {children ?? items?.map((item) => <Tab key={item.id} value={item.id} label={item.label ?? item.children}>{item.children ?? item.label}</Tab>)}
            </BaseTabs.List>
        </TabConfigContext.Provider>
    );
};

export const TabPanel = ({ id, value, className, ...props }: Omit<ComponentProps<typeof BaseTabs.Panel>, "value"> & { id?: string; value?: string }) => (
    <BaseTabs.Panel {...props} value={value ?? id} className={(state) => cx("outline-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2", typeof className === "function" ? className(state) : className)} />
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
    const { size, type, fullWidth } = useContext(TabConfigContext);
    return (
        <BaseTabs.Tab {...props} value={value ?? id} className={(state) => cx("z-10 flex h-max cursor-pointer items-center justify-center gap-2 rounded-md whitespace-nowrap text-placeholder transition duration-100 ease-linear", fullWidth && "w-full flex-1", sizes[size].base, type === "underline" ? sizes[size].underline : type === "line" ? sizes[size].line : sizes[size].button, tabStyle(type, state.active), typeof className === "function" ? className(state) : className)}>
            {isValidElement(Icon) && Icon}
            {isReactComponent(Icon) && <Icon data-icon className="size-4 transition-inherit-all" />}
            <span className={cx("flex items-center gap-2", type !== "line" && "px-0.5")}>{children || label}{badge !== undefined && <Badge size="sm" type={type === "underline" || type === "line" || type === "button-brand" ? "pill-color" : "modern"} color={type === "underline" || type === "line" || type === "button-brand" ? "brand" : "gray"}>{badge}</Badge>}</span>
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
