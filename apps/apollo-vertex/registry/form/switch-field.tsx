"use client";

import type * as React from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useFieldContext } from "./form-context";
import { useTranslatedErrors } from "./use-translated-errors";

interface SwitchFieldProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

function SwitchField({ label, description }: SwitchFieldProps) {
  const field = useFieldContext<boolean>();
  const errors = useTranslatedErrors(field.state.meta.errors);
  const invalid = errors.length > 0;

  return (
    <Field orientation="horizontal" data-invalid={invalid}>
      <Switch
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
        onBlur={field.handleBlur}
        aria-invalid={invalid}
      />
      <FieldContent>
        {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
        <FieldError errors={errors} />
      </FieldContent>
    </Field>
  );
}

export { SwitchField };
export type { SwitchFieldProps };
