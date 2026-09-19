import { createContext, isValidElement, useContext, type ButtonHTMLAttributes, type FC, type ReactNode } from "react";
import { cx, sortCx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";
import { controlScale } from "@/components/base/control-scale";

export const styles = sortCx({
    common: { root: "group/button-group inline-flex h-max cursor-pointer items-center bg-surface-1 font-semibold whitespace-nowrap text-secondary shadow-skeuomorphic ring-1 ring-strong outline-accent-strong ring-inset hover:bg-layer-1-hover hover:text-primary focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:text-secondary/50 data-selected:bg-layer-1-hover data-selected:text-primary", icon: "pointer-events-none text-placeholder" },
    sizes: {
        sm: { root: `${controlScale.button.sm} gap-2 first:rounded-l-md last:rounded-r-md data-icon-leading:pl-3 data-icon-only:size-8 data-icon-only:px-0`, icon: "size-4" },
        md: { root: `${controlScale.button.md} gap-2 first:rounded-l-md last:rounded-r-md data-icon-leading:pl-4 data-icon-only:size-9 data-icon-only:px-0`, icon: "size-4" },
        lg: { root: `${controlScale.button.lg} gap-2 first:rounded-l-md last:rounded-r-md data-icon-leading:pl-5 data-icon-only:size-10 data-icon-only:px-0`, icon: "size-4" },
    },
});

type ButtonSize = keyof typeof styles.sizes;
interface ButtonGroupContext { size: ButtonSize }
const context = createContext<ButtonGroupContext>({ size: "md" });

interface ButtonGroupItemProps extends ButtonHTMLAttributes<HTMLButtonElement> { iconLeading?: FC<{ className?: string }> | ReactNode; iconTrailing?: FC<{ className?: string }> | ReactNode; isSelected?: boolean; }
export const ButtonGroupItem = ({ iconLeading: IconLeading, iconTrailing: IconTrailing, children, className, isSelected, ...props }: ButtonGroupItemProps) => {
    const { size } = useContext(context);
    const isIcon = Boolean((IconLeading || IconTrailing) && !children);
    return <button {...props} type={props.type ?? "button"} aria-pressed={isSelected} data-selected={isSelected || undefined} data-icon-only={isIcon || undefined} data-icon-leading={Boolean(IconLeading) || undefined} className={cx(styles.common.root, styles.sizes[size].root, className)}>{isReactComponent(IconLeading) && <IconLeading className={cx(styles.common.icon, styles.sizes[size].icon)} />}{isValidElement(IconLeading) && IconLeading}{children}{isReactComponent(IconTrailing) && <IconTrailing className={cx(styles.common.icon, styles.sizes[size].icon)} />}{isValidElement(IconTrailing) && IconTrailing}</button>;
};

interface ButtonGroupProps { size?: ButtonSize; className?: string; children: ReactNode; }
export const ButtonGroup = ({ children, size = "md", className }: ButtonGroupProps) => <context.Provider value={{ size }}><div className={cx("relative z-0 inline-flex w-max -space-x-px rounded-md shadow-xs", className)}>{children}</div></context.Provider>;
