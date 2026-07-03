"use client";

import type * as React from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFieldContext } from "./form-context";
import { useTranslatedErrors } from "./use-translated-errors";

interface TextFieldProps
  extends Omit<
    React.ComponentProps<typeof Input>,
    "value" | "onChange" | "onBlur" | "name" | "id"
  > {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

function TextField({ label, description, ...props }: TextFieldProps) {
  const field = useFieldContext<string>();
  const errors = useTranslatedErrors(field.state.meta.errors);
  const invalid = errors.length > 0;

  return (
    <Field data-invalid={invalid}>
      {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
      <Input
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

export { TextField };
export type { TextFieldProps };
