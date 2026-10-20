"use client";

import { useVertexTranslation } from "@/lib/vertex-translation";
import { normalizeErrors } from "./field-utils";

export function useTranslatedErrors(
  errors: ReadonlyArray<unknown>,
): Array<{ message: string }> {
  const { t } = useVertexTranslation();

  return normalizeErrors(errors).map((error) => ({
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- runtime validation message isn't in the typed i18n catalog
    message: t(error.message as never, { defaultValue: error.message }),
  }));
}
