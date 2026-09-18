import type { ButtonHTMLAttributes } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { AppIcons } from "@/components/foundations/icons";
import { cx } from "@/utils/cx";
import { controlScale } from "@/components/base/control-scale";

const sizes = {
    xs: { root: controlScale.iconButton.xs, icon: "size-4" },
    sm: { root: controlScale.iconButton.sm, icon: "size-4" },
    md: { root: controlScale.iconButton.md, icon: "size-4" },
    lg: { root: controlScale.iconButton.lg, icon: "size-4" },
};

const themes = {
    light: "text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 outline-focus-ring",
    dark: "text-fg-white/70 hover:text-fg-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 outline-focus-ring",
};

interface CloseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
    theme?: "light" | "dark";
    size?: "xs" | "sm" | "md" | "lg";
    label?: string;
    onPress?: () => void;
}

export const CloseButton = ({ label, className, size = "sm", theme = "light", onPress, ...otherProps }: CloseButtonProps) => {
    return (
        <BaseButton
            {...otherProps}
            onClick={onPress || otherProps.onClick}
            aria-label={label || "Close"}
            className={cx(
                    "flex cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear focus:outline-hidden",
                    sizes[size].root,
                    themes[theme],
                    className,
                )}
        >
            <AppIcons.Close aria-hidden="true" className={cx("shrink-0 transition-inherit-all", sizes[size].icon)} />
        </BaseButton>
    );
};
