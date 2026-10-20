import type { BaseFormatOptions } from "./base-format-options";
import { MAX_FRACTIONAL_DIGITS } from "./constants";

export const formatNumber = (
  locale: Intl.LocalesArgument,
  value: number,
  settings: BaseFormatOptions = {},
) => {
  const { notation } = settings;

  const formattedValue = Intl.NumberFormat(locale, {
    notation,
    maximumFractionDigits: MAX_FRACTIONAL_DIGITS,
    minimumFractionDigits: MAX_FRACTIONAL_DIGITS,
    trailingZeroDisplay: "stripIfInteger",
  }).format(value);

  return formattedValue;
};
