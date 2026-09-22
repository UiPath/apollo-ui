import type { DateTime } from "luxon";
import { Duration } from "luxon";
import { z } from "zod";
import type { BaseFormatOptions } from "./base-format-options";
import { computeDurationUnits } from "./compute-duration-units";
import type { FormatDurationOptions } from "./format-duration";

interface BinLabelFormatSettingProps {
  value: number | DateTime;
  type: "duration" | "numeric" | "datetime";
  isCompact?: boolean;
}

export const binLabelFormatSetting = ({
  value,
  type,
  isCompact = false,
}: BinLabelFormatSettingProps): BaseFormatOptions | FormatDurationOptions => {
  if (type === "duration") {
    return {
      units: computeDurationUnits(Duration.fromMillis(z.number().parse(value))),
      compactUnit: isCompact,
    } satisfies FormatDurationOptions;
  }

  if (isCompact) {
    return { notation: "compact" };
  }

  return {};
};
