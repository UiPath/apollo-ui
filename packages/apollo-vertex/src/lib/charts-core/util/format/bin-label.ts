import { DateTime, Interval } from "luxon";
import { assert } from "@/lib/asserts/assert";
import { assertDefined } from "@/lib/asserts/assert-defined";
import { adaptiveBinFormatting } from "../binning/adaptive-bin-formatting";
import { binLabelFormatSetting } from "./bin-label-format-setting";
import { format } from "./format";

interface BinLabelProps {
  locale: Intl.LocalesArgument;
  type: "duration" | "numeric" | "datetime";
  bin: {
    start: number | DateTime;
    end: number | DateTime;
  };
  chartRange?: Interval;
  isCompact?: boolean;
}

export const binLabel = ({
  locale,
  bin,
  type,
  chartRange,
  isCompact = false,
}: BinLabelProps) => {
  const { start, end } = bin;

  if (type === "datetime" && isCompact) {
    assert(start instanceof DateTime, "Min must be a DateTime");
    assert(end instanceof DateTime, "Max must be a DateTime");

    const interval = Interval.fromDateTimes(start, end);
    return adaptiveBinFormatting(
      locale,
      interval,
      assertDefined(chartRange, "Chart range is required"),
    );
  }

  const binStartSettings = binLabelFormatSetting({
    value: start,
    type,
    isCompact,
  });

  const binEndSettings = binLabelFormatSetting({
    value: end,
    type,
    isCompact,
  });

  return isCompact
    ? format(locale, start, type, binStartSettings)
    : `${format(locale, start, type, binStartSettings)} - ${format(locale, end, type, binEndSettings)}`;
};
