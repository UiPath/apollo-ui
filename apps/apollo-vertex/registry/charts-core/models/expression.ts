import type { DataModelField } from "./field";
import type { FilterValues } from "./filter-values";

export type AggregationKind =
  | "ANY"
  | "DISTINCT_COUNT"
  | "COUNT"
  | "AVERAGE"
  | "MIN"
  | "MAX"
  | "PERCENTAGE"
  | "SUM"
  | "PERCENTILE"
  | "MEDIAN";

export interface DataModelAggregate {
  id?: string;
  type: "aggregate";
  aggregation: AggregationKind;
  argument: DataModelField;
  filters?: FilterValues[];
}

export type MetricExpression = DataModelAggregate;
