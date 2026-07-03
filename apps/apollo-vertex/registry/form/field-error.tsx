"use client";

import type * as React from "react";
import { FieldError as FieldErrorPrimitive } from "@/components/ui/field";
import { useTranslatedErrors } from "./use-translated-errors";

interface FieldErrorProps
  extends Omit<React.ComponentProps<typeof FieldErrorPrimitive>, "errors"> {
  errors: ReadonlyArray<unknown>;
}

function FieldError({ errors, ...props }: FieldErrorProps) {
  const translated = useTranslatedErrors(errors);
  return <FieldErrorPrimitive errors={translated} {...props} />;
}

export { FieldError };
export type { FieldErrorProps };
