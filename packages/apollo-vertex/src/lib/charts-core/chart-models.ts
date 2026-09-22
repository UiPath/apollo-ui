import type { Interval } from "luxon";
import type { MetricExpression } from "./models/expression";
import type {
  DatetimeModelField,
  DataModelField,
  DataModelFieldType,
  NumericOrDatetimeModelField,
  StringModelField,
} from "./models/field";
import type { PrimitiveValue } from "./models/primitive-value";

export type {
  DataModelField,
  DataModelFieldType,
  DatetimeModelField,
  NumericOrDatetimeModelField,
  StringModelField,
};
export type DimensionType = DataModelFieldType;

export interface DataModelMetric {
  id: string;
  display: string;
  expression: MetricExpression;
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
