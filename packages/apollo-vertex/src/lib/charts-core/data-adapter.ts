import type {
  QueryOptions,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import type {
  BarChartData,
  ChartDataModel,
  DatetimeModelField,
  DistributionChartData,
  KpiChartData,
  KpiDataModel,
  LineChartData,
  MultiLineChartData,
  NumericOrDatetimeModelField,
  StringModelField,
  TableChartData,
} from "./chart-models";
import type { BarChartConfiguration } from "./models/configurations/bar-chart-configuration";
import type { TableChartState } from "./models/configurations/chart-properties";
import type { DistributionChartConfiguration } from "./models/configurations/distribution-chart-configuration";
import type { KpiChartConfiguration } from "./models/configurations/kpi-chart-configuration";
import type { LineChartConfiguration } from "./models/configurations/line-chart-configuration";
import type { MultiLineChartConfiguration } from "./models/configurations/multi-line-chart-configuration";
import type { TableChartConfiguration } from "./models/configurations/table-chart-configuration";
import type { ListFilter } from "./models/filter";
import type { PrimitiveValue } from "./models/primitive-value";
import type { TableDataModel } from "./table-data-model";

export interface DataAdapter {
  charts: {
    table: (
      configuration: TableChartConfiguration,
      dataModel: TableDataModel,
      state: TableChartState,
    ) => UseSuspenseQueryOptions<
      TableChartData,
      Error,
      TableChartData,
      string[]
    >;
    bar: (
      configuration: BarChartConfiguration,
      dataModel: ChartDataModel<StringModelField>,
    ) => UseSuspenseQueryOptions<BarChartData, Error, BarChartData, string[]>;
    distribution: (
      configuration: DistributionChartConfiguration,
      dataModel: ChartDataModel<NumericOrDatetimeModelField>,
    ) => UseSuspenseQueryOptions<
      DistributionChartData,
      Error,
      DistributionChartData,
      string[]
    >;
    line: (
      configuration: LineChartConfiguration,
      dataModel: ChartDataModel<DatetimeModelField>,
    ) => UseSuspenseQueryOptions<LineChartData, Error, LineChartData, string[]>;
    multiLine: (
      configuration: MultiLineChartConfiguration,
      dataModel: ChartDataModel<DatetimeModelField>,
    ) => UseSuspenseQueryOptions<
      MultiLineChartData,
      Error,
      MultiLineChartData,
      string[]
    >;
    kpi: (
      configuration: KpiChartConfiguration,
      dataModel: KpiDataModel,
    ) => UseSuspenseQueryOptions<KpiChartData, Error, KpiChartData, string[]>;
  };
  filters: {
    list: (filter: ListFilter) => QueryOptions<
      PrimitiveValue[],
      Error,
      PrimitiveValue[]
    > & {
      queryKey: readonly unknown[];
    };
  };
}
