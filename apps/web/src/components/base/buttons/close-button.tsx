import type { ButtonHTMLAttributes } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { AppIcons } from "@/components/foundations/icons";
import { cx } from "@/utils/cx";
import { controlScale } from "@/components/base/control-scale";
import { useTranslation } from "react-i18next";

const sizes = {
    xs: { root: controlScale.iconButton.xs, icon: "size-4" },
    sm: { root: controlScale.iconButton.sm, icon: "size-4" },
    md: { root: controlScale.iconButton.md, icon: "size-4" },
    lg: { root: controlScale.iconButton.lg, icon: "size-4" },
};

const themes = {
    light: "text-placeholder hover:bg-layer-1-hover hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 outline-accent-strong",
    dark: "text-fg-white/70 hover:text-fg-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 outline-accent-strong",
};

interface CloseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
    theme?: "light" | "dark";
    size?: "xs" | "sm" | "md" | "lg";
    label?: string;
    onPress?: () => void;
}

export const CloseButton = ({ label, className, size = "sm", theme = "light", onPress, ...otherProps }: CloseButtonProps) => {
    const { t } = useTranslation();
    return (
        <BaseButton
            {...otherProps}
            onClick={onPress || otherProps.onClick}
            aria-label={label || t("common.close")}
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
