"use client";

import type * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useFieldContext } from "./form-context";
import { useTranslatedErrors } from "./use-translated-errors";

interface CheckboxFieldProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

function CheckboxField({ label, description }: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();
  const errors = useTranslatedErrors(field.state.meta.errors);
  const invalid = errors.length > 0;

  return (
    <Field orientation="horizontal" data-invalid={invalid}>
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
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

export { CheckboxField };
export type { CheckboxFieldProps };
