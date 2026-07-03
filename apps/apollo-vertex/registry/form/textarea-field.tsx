"use client";

import type * as React from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useFieldContext } from "./form-context";
import { useTranslatedErrors } from "./use-translated-errors";

interface TextareaFieldProps
  extends Omit<
    React.ComponentProps<typeof Textarea>,
    "value" | "onChange" | "onBlur" | "name" | "id"
  > {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

function TextareaField({ label, description, ...props }: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const errors = useTranslatedErrors(field.state.meta.errors);
  const invalid = errors.length > 0;

  return (
    <Field data-invalid={invalid}>
      {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={invalid}
        {...props}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={errors} />
    </Field>
  );
}

export { TextareaField };
export type { TextareaFieldProps };
