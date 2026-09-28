import { MAX_FRACTIONAL_DIGITS } from "./constants";
import type { PercentageFormatOptions } from "./percentage-format-options";

const formatPercentageImpl = (
  locale: Intl.LocalesArgument,
  value: number,
  settings: PercentageFormatOptions = {},
) => {
  const { notation } = settings;

  if (notation === "minimal") {
    return Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(value);
  }

  return Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: MAX_FRACTIONAL_DIGITS,
    minimumFractionDigits: MAX_FRACTIONAL_DIGITS,
    trailingZeroDisplay: "stripIfInteger",
    notation,
  }).format(value);
};

export const formatPercentage = (
  locale: Intl.LocalesArgument,
  value: number,
  settings: PercentageFormatOptions = {},
) => {
  const isExactlyZero = value === 0;
  const isExactlyOne = value === 1;
  const zeroLabel = formatPercentageImpl(locale, 0, settings);
  const hundredLabel = formatPercentageImpl(locale, 1, settings);

  const label = formatPercentageImpl(locale, value, settings);

  if (label === zeroLabel && !isExactlyZero) {
    return `≈${zeroLabel}`;
  }

  if (label === hundredLabel && !isExactlyOne) {
    return `≈${hundredLabel}`;
  }

  return label;
};
