import type { z } from "zod";
import type { BaseChartConfigurationSchema } from "./models/configurations/base-chart-configuration";
import type { FilterValues } from "./models/filter-values";

export type ConfigFilter = NonNullable<
  z.infer<typeof BaseChartConfigurationSchema>["filters"]
>[number];

export function mapConfigFilterToFilterValues(
  filter: ConfigFilter,
): FilterValues {
  if (
    filter.type === "range" &&
    "valueType" in filter &&
    filter.valueType === "datetime"
  ) {
    return {
      type: "period",
      field: filter.field,
      range: filter.range,
    };
  }
  if (filter.type === "range") {
    return {
      type: "range",
      field: filter.field,
      range: filter.range,
    };
  }
  if (filter.type === "search") {
    return {
      type: "search",
      field: filter.field,
      pattern: filter.pattern,
      searchFilterType: filter.searchFilterType,
    };
  }
  return filter satisfies FilterValues;
}
