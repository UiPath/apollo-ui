import type { Aggregation } from "../../models/aggregation";
import type { BaseFormatOptions } from "./base-format-options";
import { format } from "./format";

export function formatMetricValue(
  locale: Intl.LocalesArgument,
  value: unknown,
  aggregation: Aggregation,
  options?: BaseFormatOptions,
): string {
  switch (aggregation.kind) {
    case "count":
    case "sum":
    case "avg":
    case "min":
    case "max":
      return format(locale, value, "numeric", options);
  }
}
