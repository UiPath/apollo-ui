import type { ReactElement } from "react";
import type { ParseKeys } from "react-i18next";

export type TranslationKey =
  | {
      i18nKey: ParseKeys;
      values: Record<string, string | number | string[]>;
      components: Record<string, ReactElement>;
    }
  | ParseKeys;

type TranslationObject = Extract<TranslationKey, { i18nKey: ParseKeys }>;

// Plain strings are app-catalog keys or vertex keys. Vertex keys are strings,
// so they still typecheck; the app catalog is what makes invoice labels resolve.
export type ShellNavLabel = string | TranslationObject;
