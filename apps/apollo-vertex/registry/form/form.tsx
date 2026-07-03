"use client";

import { createFormHook } from "@tanstack/react-form";
import { CheckboxField } from "./checkbox-field";
import { fieldContext, formContext } from "./form-context";
import { FormErrorSummary } from "./form-error-summary";
import { RadioGroupField } from "./radio-group-field";
import { SelectField } from "./select-field";
import { SubmitButton } from "./submit-button";
import { SwitchField } from "./switch-field";
import { TextField } from "./text-field";
import { TextareaField } from "./textarea-field";

const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    SelectField,
    CheckboxField,
    SwitchField,
    RadioGroupField,
  },
  formComponents: {
    SubmitButton,
    FormErrorSummary,
  },
});

export { useAppForm, withForm };
export { useFieldContext, useFormContext } from "./form-context";
export { useTranslatedErrors } from "./use-translated-errors";
export type { FieldOption } from "./field-utils";
export { FieldError } from "./field-error";
export type { FieldErrorProps } from "./field-error";
export { FormErrorSummary } from "./form-error-summary";
export type { FormErrorSummaryProps } from "./form-error-summary";
export { CheckboxField } from "./checkbox-field";
export type { CheckboxFieldProps } from "./checkbox-field";
export { RadioGroupField } from "./radio-group-field";
export type { RadioGroupFieldProps } from "./radio-group-field";
export { SelectField } from "./select-field";
export type { SelectFieldProps } from "./select-field";
export { SubmitButton } from "./submit-button";
export type { SubmitButtonProps } from "./submit-button";
export { SwitchField } from "./switch-field";
export type { SwitchFieldProps } from "./switch-field";
export { TextField } from "./text-field";
export type { TextFieldProps } from "./text-field";
export { TextareaField } from "./textarea-field";
export type { TextareaFieldProps } from "./textarea-field";
