"use client";

import type * as React from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { descriptionId, errorId, fieldDescribedBy } from "./field-utils";
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
  const describedBy = fieldDescribedBy(
    field.name,
    Boolean(description),
    invalid,
  );

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
        {...(describedBy ? { "aria-describedby": describedBy } : {})}
        {...props}
      />
      {description ? (
        <FieldDescription id={descriptionId(field.name)}>
          {description}
        </FieldDescription>
      ) : null}
      <FieldError id={errorId(field.name)} errors={errors} />
    </Field>
  );
}

export { TextField };
export type { TextFieldProps };
