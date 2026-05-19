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
  const a = metric.aggregation;
  switch (a.kind) {
    case "count":
      return {
        function: "COUNT",
        field: a.field ?? metric.id,
        alias: metric.id,
      };
    case "sum":
      return { function: "SUM", field: a.field, alias: metric.id };
    case "avg":
      return { function: "AVG", field: a.field, alias: metric.id };
    case "min":
      return { function: "MIN", field: a.field, alias: metric.id };
    case "max":
      return { function: "MAX", field: a.field, alias: metric.id };
  }
}
