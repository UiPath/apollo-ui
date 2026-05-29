import type {
  BarChartConfiguration,
  ChartDataModel,
  DatetimeModelField,
  LineChartConfiguration,
  StringModelField,
} from "@/lib/charts-core";

export const BASE_URL = "/api/insights/popoc/DefaultTenant/insightsrtm_/api/v1";
export const DEFAULT_SOURCE_TYPE = "AO";

export const STORAGE_KEY = "test-insights-adapter-config:v5";

const statusField: StringModelField = {
  id: "PROCESSRUNS.STATUS",
  display: "Status",
  type: "string",
};

const eventTimeField: DatetimeModelField = {
  id: "PROCESSRUNS.EVENTTIMEUTC",
  display: "Event time",
  type: "datetime",
};

const instanceIdField: StringModelField = {
  id: "PROCESSRUNS.INSTANCEID",
  display: "Instance ID",
  type: "string",
};

export const barChartDataModel: ChartDataModel<StringModelField> = {
  id: "test-insights-bar",
  dimensions: [statusField],
  metrics: [
    {
      id: "instance_count",
      display: "Instances",
      expression: {
        type: "aggregate",
        aggregation: "COUNT",
        argument: instanceIdField,
      },
    },
  ],
};

export const barChartConfiguration: BarChartConfiguration = {
  id: "test-insights-bar-config",
  name: "Instances by status",
  type: "bar",
  dimensions: ["PROCESSRUNS.STATUS"],
  metrics: ["instance_count"],
  filterTableId: "PROCESSRUNS",
};

export const lineChartDataModel: ChartDataModel<DatetimeModelField> = {
  id: "test-insights-line",
  dimensions: [eventTimeField],
  metrics: [
    {
      id: "instance_count_over_time",
      display: "Instances over time",
      expression: {
        type: "aggregate",
        aggregation: "COUNT",
        argument: instanceIdField,
      },
    },
  ],
};

export const lineChartConfiguration: LineChartConfiguration = {
  id: "test-insights-line-config",
  name: "Completed instances over time (latest only)",
  type: "line",
  dimensions: ["PROCESSRUNS.EVENTTIMEUTC"],
  metrics: ["instance_count_over_time"],
  filters: [
    {
      type: "list",
      valueType: "string",
      field: "PROCESSRUNS.STATUS",
      values: ["Completed", "Cancelled"],
    },
    {
      type: "list",
      valueType: "string",
      field: "PROCESSRUNS.ISLATEST",
      values: ["1"],
    },
  ],
};
