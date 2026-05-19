import { useIsFetching, useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";
import { useTranslation } from "react-i18next";
import { assert } from "@/lib/asserts/assert";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  binLabel,
  type ChartDataModel,
  ChartLoadingBoundary,
  type DataAdapter,
  type DatetimeModelField,
  formatMetricValue,
  getChartRange,
  type LineChartConfiguration,
  SpinnerWithChildren,
} from "@/lib/charts-core";
import { LineChart } from "./line-chart-view";

export interface LineChartWithAdapterProps {
  configuration: LineChartConfiguration;
  dataModel: ChartDataModel<DatetimeModelField>;
  dataAdapter: DataAdapter;
}

export function LineChartWithAdapter({
  configuration,
  dataModel,
  dataAdapter,
}: LineChartWithAdapterProps) {
  return (
    <ChartLoadingBoundary configuration={configuration} dataModel={dataModel}>
      <LineChartResolver
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={dataAdapter}
      />
    </ChartLoadingBoundary>
  );
}

function LineChartResolver({
  configuration,
  dataModel,
  dataAdapter,
}: LineChartWithAdapterProps) {
  const {
    i18n: { language },
  } = useTranslation();

  const deferrableProps = useDeferredValue({ configuration, dataModel });
  const query = dataAdapter.charts.line(configuration, dataModel);
  const deferredQuery = dataAdapter.charts.line(
    deferrableProps.configuration,
    deferrableProps.dataModel,
  );

  const isFetching = useIsFetching(query) > 0;
  const { bins, values } = useSuspenseQuery(deferredQuery).data;

  const dimensionId = assertDefined(
    configuration.dimensions[0],
    "Line chart must have at least one dimension",
  );
  const dimension = assertDefined(
    dataModel.dimensions.find((d) => d.id === dimensionId),
    `Dimension ${dimensionId} not found in dataModel`,
  );
  const metricId = assertDefined(
    configuration.metrics[0],
    "Line chart must have at least one metric",
  );
  const metric = assertDefined(
    dataModel.metrics.find((m) => m.id === metricId),
    `Metric ${metricId} not found in dataModel`,
  );

  assert(dimension.type === "datetime", "Dimension type must be datetime");

  const chartRange = getChartRange({ type: dimension.type, bins });

  const data = bins.map((bin, index) => ({
    x: binLabel({
      locale: language,
      type: dimension.type,
      bin,
      chartRange,
      isCompact: true,
    }),
    y: values[index] ?? 0,
  }));

  return (
    <SpinnerWithChildren loading={isFetching}>
      <LineChart
        data={data}
        seriesLabel={metric.display}
        formatValue={(value) =>
          formatMetricValue(language, value, metric.aggregation)
        }
      />
    </SpinnerWithChildren>
  );
}
