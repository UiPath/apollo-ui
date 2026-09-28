import type { DataModelMetric } from "@/lib/charts-core";

type DataFabricFunction = "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";

export interface DataFabricAggregate {
  function: DataFabricFunction;
  field: string;
  alias: string;
}

export function mapMetricToDataFabricAggregate(
  metric: DataModelMetric,
): DataFabricAggregate {
  const expr = metric.expression;
  if (expr.filters && expr.filters.length > 0) {
    throw new Error(
      `Data Fabric does not support per-aggregate filters (metric "${metric.id}").`,
    );
  }

  const field = expr.argument.id;
  switch (expr.aggregation) {
    case "COUNT":
      return { function: "COUNT", field, alias: metric.id };
    case "SUM":
      return { function: "SUM", field, alias: metric.id };
    case "AVERAGE":
      return { function: "AVG", field, alias: metric.id };
    case "MIN":
      return { function: "MIN", field, alias: metric.id };
    case "MAX":
      return { function: "MAX", field, alias: metric.id };
    case "ANY":
    case "DISTINCT_COUNT":
    case "MEDIAN":
    case "PERCENTAGE":
    case "PERCENTILE":
      throw new Error(
        `Data Fabric does not support aggregation "${expr.aggregation}" (metric "${metric.id}").`,
      );
  }
}
