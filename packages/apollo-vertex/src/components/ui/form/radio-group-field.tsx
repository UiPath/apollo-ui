"use client";

import type * as React from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  descriptionId,
  errorId,
  type FieldOption,
  fieldDescribedBy,
} from "./field-utils";
import { useFieldContext } from "./form-context";
import { useTranslatedErrors } from "./use-translated-errors";

interface RadioGroupFieldProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  options: FieldOption[];
}

function RadioGroupField({
  label,
  description,
  options,
}: RadioGroupFieldProps) {
  const field = useFieldContext<string>();
  const errors = useTranslatedErrors(field.state.meta.errors);
  const invalid = errors.length > 0;
  const labelId = `${field.name}-label`;
  const describedBy = fieldDescribedBy(
    field.name,
    Boolean(description),
    invalid,
  );

  return (
    <Field data-invalid={invalid}>
      {label ? <FieldLabel id={labelId}>{label}</FieldLabel> : null}
      <RadioGroup
        value={field.state.value ?? ""}
        onValueChange={field.handleChange}
        aria-invalid={invalid}
        {...(label ? { "aria-labelledby": labelId } : {})}
        {...(describedBy ? { "aria-describedby": describedBy } : {})}
      >
        {options.map((option) => {
          const itemId = `${field.name}-${option.value}`;
          return (
            <Field key={option.value} orientation="horizontal">
              <RadioGroupItem
                value={option.value}
                id={itemId}
                onBlur={field.handleBlur}
              />
              <FieldLabel htmlFor={itemId} className="font-normal">
                {option.label}
              </FieldLabel>
            </Field>
          );
        })}
      </RadioGroup>
      {description ? (
        <FieldDescription id={descriptionId(field.name)}>
          {description}
        </FieldDescription>
      ) : null}
      <FieldError id={errorId(field.name)} errors={errors} />
    </Field>
  );
}

export { RadioGroupField };
export type { RadioGroupFieldProps };
