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
import { descriptionId, errorId, fieldDescribedBy } from "./field-utils";
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
  const describedBy = fieldDescribedBy(
    field.name,
    Boolean(description),
    invalid,
  );

  return (
    <Field orientation="horizontal" data-invalid={invalid}>
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
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

export { CheckboxField };
export type { CheckboxFieldProps };
