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
  type DistributionChartConfiguration,
  formatMetricValue,
  getChartRange,
  type NumericOrDatetimeModelField,
  SpinnerWithChildren,
} from "@/lib/charts-core";
import { DistributionChart } from "./distribution-chart-view";

export interface DistributionChartWithAdapterProps {
  configuration: DistributionChartConfiguration;
  dataModel: ChartDataModel<NumericOrDatetimeModelField>;
  dataAdapter: DataAdapter;
}

export function DistributionChartWithAdapter({
  configuration,
  dataModel,
  dataAdapter,
}: DistributionChartWithAdapterProps) {
  return (
    <ChartLoadingBoundary configuration={configuration} dataModel={dataModel}>
      <DistributionChartResolver
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={dataAdapter}
      />
    </ChartLoadingBoundary>
  );
}

function DistributionChartResolver({
  configuration,
  dataModel,
  dataAdapter,
}: DistributionChartWithAdapterProps) {
  const {
    i18n: { language },
  } = useTranslation();

  const deferrableProps = useDeferredValue({ configuration, dataModel });
  const query = dataAdapter.charts.distribution(configuration, dataModel);
  const deferredQuery = dataAdapter.charts.distribution(
    deferrableProps.configuration,
    deferrableProps.dataModel,
  );

  const isFetching = useIsFetching(query) > 0;
  const { bins, values } = useSuspenseQuery(deferredQuery).data;

  const dimensionId = assertDefined(
    configuration.dimensions[0],
    "Distribution chart dimension is required",
  );
  const dimension = assertDefined(
    dataModel.dimensions.find((d) => d.id === dimensionId),
    `Dimension ${dimensionId} not found in dataModel`,
  );
  const metricId = assertDefined(
    configuration.metrics[0],
    "Distribution chart metric is required",
  );
  const metric = assertDefined(
    dataModel.metrics.find((m) => m.id === metricId),
    `Metric ${metricId} not found in dataModel`,
  );

  assert(
    dimension.type === "datetime" || dimension.type === "numeric",
    "Dimension type must be datetime or numeric",
  );

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
      <DistributionChart
        data={data}
        seriesLabel={metric.display}
        formatValue={(value) =>
          formatMetricValue(language, value, metric.aggregation)
        }
      />
    </SpinnerWithChildren>
  );
}
