import type { ReactElement } from "react";
import type { ParseKeys } from "react-i18next";

export type TranslationKey =
  | {
      i18nKey: ParseKeys;
      values: Record<string, string | number | string[]>;
      components: Record<string, ReactElement>;
    }
  | ParseKeys;
