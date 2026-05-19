import type { BaseFormatOptions } from "./base-format-options";
import { MAX_FRACTIONAL_DIGITS } from "./constants";

export interface FormatCurrencyOptions extends BaseFormatOptions {
  currency?: string;
}

export const formatCurrency = (
  locale: Intl.LocalesArgument,
  value: number,
  settings: FormatCurrencyOptions = {},
) => {
  const { notation, currency = "USD" } = settings;
  const isCompact = notation === "compact";
  const isLowNumber = value != null && value < 1000;
  const compactMinimumFractionDigits = isLowNumber ? 2 : 0;

  return Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: isCompact ? compactMinimumFractionDigits : 2,
    maximumFractionDigits: MAX_FRACTIONAL_DIGITS,
    compactDisplay: "short",
    notation,
  }).format(value);
};
