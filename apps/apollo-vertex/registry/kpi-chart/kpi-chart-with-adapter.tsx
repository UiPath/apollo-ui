import { useIsFetching, useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";
import { useTranslation } from "react-i18next";
import { assertNumber } from "@/lib/asserts/assert-number";
import {
  ChartLoadingBoundary,
  type DataAdapter,
  formatMetricValue,
  type KpiChartConfiguration,
  type KpiDataModel,
  SpinnerWithChildren,
} from "@/lib/charts-core";
import { KpiChart } from "./kpi-chart-view";

export interface KpiChartWithAdapterProps {
  configuration: KpiChartConfiguration;
  dataModel: KpiDataModel;
  dataAdapter: DataAdapter;
}

export function KpiChartWithAdapter({
  configuration,
  dataModel,
  dataAdapter,
}: KpiChartWithAdapterProps) {
  return (
    <ChartLoadingBoundary configuration={configuration} dataModel={dataModel}>
      <KpiChartResolver
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={dataAdapter}
      />
    </ChartLoadingBoundary>
  );
}

function KpiChartResolver({
  configuration,
  dataModel,
  dataAdapter,
}: KpiChartWithAdapterProps) {
  const {
    i18n: { language },
  } = useTranslation();

  const deferrableProps = useDeferredValue({ configuration, dataModel });
  const query = dataAdapter.charts.kpi(configuration, dataModel);
  const deferredQuery = dataAdapter.charts.kpi(
    deferrableProps.configuration,
    deferrableProps.dataModel,
  );

  const isFetching = useIsFetching(query) > 0;
  const data = useSuspenseQuery(deferredQuery).data;

  const metricId = configuration.metrics[0];
  const metric = metricId
    ? dataModel.metrics.find((m) => m.id === metricId)
    : null;

  const rawValue = Array.isArray(data.data) ? data.data[0] : data.data;
  const numericValue =
    rawValue == null ? 0 : assertNumber(rawValue, "KPI numeric value");
  const valueText = metric
    ? formatMetricValue(language, numericValue, metric.aggregation)
    : "";

  return (
    <SpinnerWithChildren loading={isFetching}>
      <KpiChart label={metric?.display ?? ""} value={valueText} />
    </SpinnerWithChildren>
  );
}
