"use client";

import type { ValidationError } from "@tanstack/react-form";
import type * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { normalizeErrors } from "./field-utils";
import { useFormContext } from "./form-context";

interface FormErrorSummaryProps
  extends Omit<React.ComponentProps<"div">, "title"> {
  title?: React.ReactNode;
}

function getMetaErrors(meta: unknown): ValidationError[] {
  if (
    typeof meta === "object" &&
    meta !== null &&
    "errors" in meta &&
    Array.isArray(meta.errors)
  ) {
    return meta.errors;
  }
  return [];
}

function FormErrorSummary({
  className,
  title,
  ...props
}: FormErrorSummaryProps) {
  const { t } = useTranslation();
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.fieldMeta}>
      {(fieldMeta) => {
        const metas = fieldMeta ? Object.values(fieldMeta) : [];
        const messages = metas
          .flatMap((meta) => normalizeErrors(getMetaErrors(meta)))
          .flatMap((error) => (error.message ? [error.message] : []))
          .map((message) =>
            // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- runtime validation message isn't in the typed i18n catalog
            t(message as never, { defaultValue: message }),
          );
        const unique = [...new Set(messages)];

        if (unique.length === 0) {
          return null;
        }

        return (
          <div
            role="alert"
            data-slot="form-error-summary"
            className={cn(
              "border-destructive/50 text-destructive rounded-lg border px-4 py-3 text-sm",
              className,
            )}
            {...props}
          >
            {title ? <p className="mb-1 font-medium">{title}</p> : null}
            <ul className="ml-4 flex list-disc flex-col gap-1">
              {unique.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        );
      }}
    </form.Subscribe>
  );
}

export { FormErrorSummary };
export type { FormErrorSummaryProps };
