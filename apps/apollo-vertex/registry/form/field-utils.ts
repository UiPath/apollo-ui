import type * as React from "react";

export interface FieldOption {
  label: React.ReactNode;
  value: string;
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
