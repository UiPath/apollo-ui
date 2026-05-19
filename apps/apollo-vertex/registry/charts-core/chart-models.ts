import type { Interval } from "luxon";
import type { Aggregation } from "./models/aggregation";
import type { PrimitiveValue } from "./models/primitive-value";

export type DimensionType = "numeric" | "string" | "boolean" | "datetime";

export interface DataModelField {
  id: string;
  type: DimensionType;
}

export interface DataModelMetric {
  id: string;
  display: string;
  aggregation: Aggregation;
}

export interface ChartDataModel<
  TField extends DataModelField = DataModelField,
> {
  id: string;
  dimensions: TField[];
  metrics: DataModelMetric[];
}

export interface KpiDataModel {
  id: string;
  metrics: DataModelMetric[];
}

export type DatetimeModelField = DataModelField & { type: "datetime" };
export type NumericOrDatetimeModelField = DataModelField & {
  type: "numeric" | "datetime";
};
export type StringModelField = DataModelField & { type: "string" };

export interface KpiChartData<_TMetaData = unknown> {
  data: number | number[];
  labels?: string[];
}

export type LineChartData = {
  values: number[];
  bins: Interval[];
};

export type DistributionChartData = {
  values: number[];
  bins:
    | Interval[]
    | {
        start: number;
        end: number;
      }[];
};

export type TableChartData = Record<string, PrimitiveValue>[];

export type BarChartData = Record<string, PrimitiveValue>[];

export type MultiLineChartData = {
  seriesByMetricId: Record<string, number[]>;
  bins: Interval[];
};
