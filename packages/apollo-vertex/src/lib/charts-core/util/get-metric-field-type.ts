import type { MetricExpression } from "../models/expression";
import type { DataModelFieldType } from "../models/field";

export function getMetricFieldType(
  expression: MetricExpression,
): DataModelFieldType {
  switch (expression.aggregation) {
    case "COUNT":
    case "DISTINCT_COUNT":
      return "numeric";
    case "PERCENTAGE":
      return "percentage";
    case "ANY":
    case "AVERAGE":
    case "MAX":
    case "MEDIAN":
    case "MIN":
    case "PERCENTILE":
    case "SUM":
      return expression.argument.type;
  }
}
