"use client";

import type * as React from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  descriptionId,
  errorId,
  type FieldOption,
  fieldDescribedBy,
} from "./field-utils";
import { useFieldContext } from "./form-context";
import { useTranslatedErrors } from "./use-translated-errors";

interface SelectFieldProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  options: FieldOption[];
  className?: string;
}

function SelectField({
  label,
  description,
  placeholder,
  options,
  className,
}: SelectFieldProps) {
  const field = useFieldContext<string>();
  const errors = useTranslatedErrors(field.state.meta.errors);
  const invalid = errors.length > 0;
  const describedBy = fieldDescribedBy(
    field.name,
    Boolean(description),
    invalid,
  );

  return (
    <Field data-invalid={invalid}>
      {label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null}
      <Select
        value={field.state.value ?? ""}
        onValueChange={field.handleChange}
      >
        <SelectTrigger
          id={field.name}
          onBlur={field.handleBlur}
          aria-invalid={invalid}
          {...(describedBy ? { "aria-describedby": describedBy } : {})}
          className={className}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? (
        <FieldDescription id={descriptionId(field.name)}>
          {description}
        </FieldDescription>
      ) : null}
      <FieldError id={errorId(field.name)} errors={errors} />
    </Field>
  );
}

export { SelectField };
export type { SelectFieldProps };
