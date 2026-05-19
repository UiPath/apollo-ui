import type { Duration } from "luxon";
import { MAX_FRACTIONAL_DIGITS } from "./constants";
import type { DurationUnit } from "./duration-unit";
import { highestDurationUnit } from "./highest-duration-unit";

export interface FormatDurationOptions {
  units?: DurationUnit[];
  isRounded?: boolean;
  compact?: boolean;
  compactUnit?: boolean;
}

export const formatDuration = (
  locale: Intl.LocalesArgument,
  value: Duration,
  options?: FormatDurationOptions,
) => {
  const units = options?.units ?? [highestDurationUnit(value)];
  const hasCompactUnit = options?.compactUnit ?? false;
  const isCompact = options?.compact ?? false;
  const durationObj = value.shiftTo(...units);

  const formattedUnits = units.map((unit) => {
    const unitValue = options?.isRounded
      ? Math.round(durationObj.get(unit))
      : durationObj.get(unit);

    return Intl.NumberFormat(locale, {
      style: "unit",
      unit,
      unitDisplay: hasCompactUnit ? "narrow" : "short",
      notation: isCompact ? "compact" : "standard",
      maximumFractionDigits: MAX_FRACTIONAL_DIGITS,
      minimumFractionDigits: MAX_FRACTIONAL_DIGITS,
      trailingZeroDisplay: "stripIfInteger",
    }).format(unitValue);
  });

  return new Intl.ListFormat(locale, {
    type: "unit",
    style: "narrow",
  }).format(formattedUnits);
};
