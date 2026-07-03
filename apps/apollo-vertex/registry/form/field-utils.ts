import type * as React from "react";

export interface FieldOption {
  label: React.ReactNode;
  value: string;
}

export function normalizeErrors(
  errors: ReadonlyArray<unknown>,
): Array<{ message?: string }> {
  return errors
    .filter((error): error is NonNullable<unknown> => error != null)
    .map((error) =>
      typeof error === "string"
        ? { message: error }
        : (error as { message?: string }),
    );
}
