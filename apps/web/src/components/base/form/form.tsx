import type { ComponentPropsWithRef } from "react";

export const Form = (props: ComponentPropsWithRef<"form">) => {
    return <form {...props} />;
};

Form.displayName = "Form";
