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
import { descriptionId, errorId, fieldDescribedBy } from "./field-utils";
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
  const describedBy = fieldDescribedBy(
    field.name,
    Boolean(description),
    invalid,
  );

  return (
    <Field orientation="horizontal" data-invalid={invalid}>
      <Switch
        id={field.name}
        name={field.name}
        checked={field.state.value ?? false}
        onCheckedChange={field.handleChange}
        onBlur={field.handleBlur}
        aria-invalid={invalid}
        {...(describedBy ? { "aria-describedby": describedBy } : {})}
      />
      <FieldContent>
        {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
        {description ? (
          <FieldDescription id={descriptionId(field.name)}>
            {description}
          </FieldDescription>
        ) : null}
        <FieldError id={errorId(field.name)} errors={errors} />
      </FieldContent>
    </Field>
  );
}

export { SwitchField };
export type { SwitchFieldProps };
