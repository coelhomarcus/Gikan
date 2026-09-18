import type { AnchorHTMLAttributes, ButtonHTMLAttributes, FC, ReactNode } from "react";
import { isValidElement } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";
import { controlScale } from "@/components/base/control-scale";

export const styles = {
    secondary: "bg-primary text-fg-quaternary ring-1 ring-primary ring-inset hover:bg-primary_hover hover:text-fg-quaternary_hover",
    tertiary: "text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover",
};

export interface CommonProps {
    isDisabled?: boolean;
    size?: "xs" | "sm";
    color?: "secondary" | "tertiary";
    icon?: FC<{ className?: string }> | ReactNode;
    tooltip?: string;
    tooltipPlacement?: "top" | "bottom" | "left" | "right";
}

export interface ButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {}
interface LinkProps extends CommonProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color"> {}
export type Props = ButtonProps | LinkProps;

export const ButtonUtility = ({ tooltip, className, isDisabled, icon: Icon, size = "sm", color = "secondary", tooltipPlacement = "top", ...otherProps }: Props) => {
    const href = "href" in otherProps ? otherProps.href : undefined;
    const content = href ? (
        <a {...(otherProps as LinkProps)} href={isDisabled ? undefined : href} aria-disabled={isDisabled || undefined} className={cx("group relative inline-flex cursor-pointer items-center justify-center rounded-md outline-focus-ring transition duration-100 ease-linear", controlScale.iconButton[size], isDisabled && "pointer-events-none opacity-50", styles[color], "*:data-icon:pointer-events-none *:data-icon:size-4 *:data-icon:shrink-0 *:data-icon:text-current", className)}>
            {isReactComponent(Icon) && <Icon data-icon />}{isValidElement(Icon) && Icon}
        </a>
    ) : (
        <BaseButton {...(otherProps as ButtonProps)} disabled={isDisabled} aria-label={tooltip} className={cx("group relative inline-flex cursor-pointer items-center justify-center rounded-md outline-focus-ring transition duration-100 ease-linear disabled:cursor-not-allowed disabled:opacity-50", controlScale.iconButton[size], styles[color], "*:data-icon:pointer-events-none *:data-icon:size-4 *:data-icon:shrink-0 *:data-icon:text-current", className)}>
            {isReactComponent(Icon) && <Icon data-icon />}{isValidElement(Icon) && Icon}
        </BaseButton>
    );

    return tooltip ? <Tooltip title={tooltip} placement={tooltipPlacement} isDisabled={isDisabled} offset={size === "xs" ? 4 : 6}>{content}</Tooltip> : content;
};
