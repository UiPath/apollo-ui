import type { DataModelMetric } from "@/lib/charts-core";
import type { AggregateFragment } from "../schemas/aggregate-fragment-schema";
import { mapFilterValuesToFragments } from "./filter-request";

export function mapMetricToInsightsAggregate(
  metric: DataModelMetric,
): AggregateFragment {
  const expr = metric.expression;
  const hasFilters = expr.filters != null && expr.filters.length > 0;

  return {
    id: metric.id,
    expression: {
      type: "aggregate",
      aggregation: expr.aggregation,
      argument: expr.argument.id,
      ...(hasFilters &&
        expr.filters && { filters: mapFilterValuesToFragments(expr.filters) }),
    },
  };
}
