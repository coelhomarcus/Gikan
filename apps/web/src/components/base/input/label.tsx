import type { LabelHTMLAttributes, ReactNode, Ref } from "react";
import { CircleQuestionMark as HelpCircle } from "lucide-react";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    children: ReactNode;
    isInvalid?: boolean;
    isRequired?: boolean;
    tooltip?: string;
    tooltipDescription?: string;
    ref?: Ref<HTMLLabelElement>;
}

export const Label = ({ isInvalid, isRequired, tooltip, tooltipDescription, className, ...props }: LabelProps) => {
    return (
        <label
            // Used for conditionally hiding/showing the label element via CSS:
            // <Input label="Visible only on mobile" className="lg:**:data-label:hidden" />
            // or
            // <Input label="Visible only on mobile" className="lg:label:hidden" />
            data-label="true"
            {...props}
            className={cx("flex cursor-default items-center gap-0.5 text-sm font-medium text-secondary", className)}
        >
            {props.children}

            <span
                className={cx(
                    "hidden text-brand-tertiary",
                    isRequired && "block",
                    typeof isRequired === "undefined" && "group-required:block",

                    isInvalid && "text-danger-primary",
                    typeof isInvalid === "undefined" && "group-invalid:text-danger-primary",
                )}
            >
                *
            </span>

            {tooltip && (
                <Tooltip title={tooltip} description={tooltipDescription} placement="top">
                    <TooltipTrigger
                        // `TooltipTrigger` inherits the disabled state from the parent form field
                        // but we don't that. We want the tooltip be enabled even if the parent
                        // field is disabled.
                        isDisabled={false}
                        className="cursor-pointer text-placeholder transition duration-200 hover:text-secondary focus:text-secondary"
                    >
                        <HelpCircle className="size-4" />
                    </TooltipTrigger>
                </Tooltip>
            )}
        </label>
    );
};

Label.displayName = "Label";
