import type * as React from "react";

export interface FieldOption {
  label: React.ReactNode;
  value: string;
}

export const descriptionId = (name: string) => `${name}-description`;
export const errorId = (name: string) => `${name}-error`;

export function fieldDescribedBy(
  name: string,
  hasDescription: boolean,
  hasError: boolean,
): string {
  return [
    hasDescription ? descriptionId(name) : null,
    hasError ? errorId(name) : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function normalizeErrors(
  errors: ReadonlyArray<unknown>,
): Array<{ message: string }> {
  return errors.flatMap((error) => {
    if (typeof error === "string") {
      return [{ message: error }];
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return [{ message: error.message }];
    }
    return [];
  });
}
