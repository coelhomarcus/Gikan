import { createContext, isValidElement, useContext, type ButtonHTMLAttributes, type FC, type ReactNode } from "react";
import { cx, sortCx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";

export const styles = sortCx({
    common: { root: "group/button-group inline-flex h-max cursor-pointer items-center bg-primary font-semibold whitespace-nowrap text-secondary shadow-skeuomorphic ring-1 ring-primary outline-brand ring-inset hover:bg-primary_hover hover:text-secondary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:text-secondary/50 data-selected:bg-primary_hover data-selected:text-secondary_hover", icon: "pointer-events-none text-fg-quaternary" },
    sizes: { sm: { root: "gap-1.5 px-3.5 py-2 text-sm first:rounded-l-lg last:rounded-r-lg data-icon-leading:pl-3 data-icon-only:px-2.5", icon: "size-5" }, md: { root: "gap-1.5 px-4 py-2.5 text-sm first:rounded-l-lg last:rounded-r-lg data-icon-leading:pl-3.5 data-icon-only:px-3", icon: "size-5" }, lg: { root: "gap-2 px-4.5 py-2.5 text-md first:rounded-l-lg last:rounded-r-lg data-icon-leading:pl-4 data-icon-only:px-3.5", icon: "size-5" } },
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
export const ButtonGroup = ({ children, size = "md", className }: ButtonGroupProps) => <context.Provider value={{ size }}><div className={cx("relative z-0 inline-flex w-max -space-x-px rounded-lg shadow-xs", className)}>{children}</div></context.Provider>;
