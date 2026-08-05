import type { ComponentType, ReactElement } from "react";
import type en from "../locales/en.json";

type ValidKeys = keyof typeof en;

type InterpolateValuesOfKey<Key extends string> =
  Key extends `${infer _Start}{{${infer Value}}}${infer Rest}`
    ? Value | InterpolateValuesOfKey<Rest>
    : never;

// Expand a union of string into an object with every entry being represented.
// e.g. 'a' | 'b' => { a: string, b: string }
type Expand<T extends string> = T extends `${infer Key} | ${infer Rest}`
  ? Key extends string
    ? { [k in Key]: string } & Expand<Rest>
    : never
  : T extends string
    ? { [k in T]: string }
    : never;

type TranslationFn = <TKey extends ValidKeys>(
  key: TKey,
  values?:
    | Expand<InterpolateValuesOfKey<TKey>>
    | Record<string, string | number | boolean | null | string[]>,
) => string;

declare module "react-i18next" {
  export type ParseKeys = ValidKeys;
  // react-i18next's native <Trans> is generic over ParseKeys and expands each
  // key into a per-key interpolation-values union; across the full key set that
  // overflows TS's representable-union limit (TS2590). Declaring a simplified
  // Trans here keeps compile-time key validation (i18nKey: ParseKeys) without
  // instantiating that generic. Extend these props if a call site needs more.
  export const Trans: ComponentType<{
    i18nKey?: ParseKeys;
    values?: Record<string, string | number | string[]>;
    components?: Record<string, ReactElement>;
  }>;
  export function useTranslation(): {
    t: TranslationFn;
    i18n: {
      exists: (key: string) => key is ParseKeys;
      changeLanguage: (locale: string) => void;
      language: string;
    };
  };
  export type TFunction = TranslationFn;
}
