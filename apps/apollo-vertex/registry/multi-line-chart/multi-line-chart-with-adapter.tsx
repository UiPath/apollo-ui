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
  type MultiLineChartConfiguration,
  SpinnerWithChildren,
} from "@/lib/charts-core";
import {
  MultiLineChart,
  type MultiLineChartSeries,
} from "./multi-line-chart-view";

const DEFAULT_COLORS = ["#0d47a1", "#fb8c00"];

export interface MultiLineChartWithAdapterProps {
  configuration: MultiLineChartConfiguration;
  dataModel: ChartDataModel<DatetimeModelField>;
  dataAdapter: DataAdapter;
}

export function MultiLineChartWithAdapter({
  configuration,
  dataModel,
  dataAdapter,
}: MultiLineChartWithAdapterProps) {
  return (
    <ChartLoadingBoundary configuration={configuration} dataModel={dataModel}>
      <MultiLineChartResolver
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={dataAdapter}
      />
    </ChartLoadingBoundary>
  );
}

function MultiLineChartResolver({
  configuration,
  dataModel,
  dataAdapter,
}: MultiLineChartWithAdapterProps) {
  const {
    t,
    i18n: { language },
  } = useTranslation();

  const deferrableProps = useDeferredValue({ configuration, dataModel });
  const query = dataAdapter.charts.multiLine(configuration, dataModel);
  const deferredQuery = dataAdapter.charts.multiLine(
    deferrableProps.configuration,
    deferrableProps.dataModel,
  );

  const isFetching = useIsFetching(query) > 0;
  const { bins, seriesByMetricId } = useSuspenseQuery(deferredQuery).data;

  const dimensionId = assertDefined(
    configuration.dimensions[0],
    "Multi line chart must have at least one dimension",
  );
  const dimension = assertDefined(
    dataModel.dimensions.find((d) => d.id === dimensionId),
    `Dimension ${dimensionId} not found in dataModel`,
  );

  assert(dimension.type === "datetime", "Dimension type must be datetime");

  const metrics = configuration.metrics
    .map((id) => dataModel.metrics.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => m != null);

  assertDefined(metrics[0], "Primary metric is required");

  const chartRange = getChartRange({ type: dimension.type, bins });

  const data = bins.map((bin, index) => {
    const row: Record<string, string | number> = {
      x: binLabel({
        locale: language,
        type: dimension.type,
        bin,
        chartRange,
        isCompact: true,
      }),
    };
    for (const metric of metrics) {
      const values = seriesByMetricId[metric.id] ?? [];
      row[metric.id] = values[index] ?? 0;
    }
    return row;
  });

  const series: MultiLineChartSeries[] = metrics.map((metric, idx) => {
    const total = (seriesByMetricId[metric.id] ?? []).reduce(
      (sum, v) => sum + v,
      0,
    );
    const color =
      DEFAULT_COLORS[idx % DEFAULT_COLORS.length] ??
      DEFAULT_COLORS[0] ??
      "#000";
    return {
      id: metric.id,
      label: metric.display,
      color,
      axis: idx === 0 ? "left" : "right",
      formatValue: (value: number) =>
        formatMetricValue(language, value, metric.aggregation),
      totalText: formatMetricValue(language, total, metric.aggregation),
      totalLabel: t("total_metric", { metric: metric.display }),
    };
  });

  return (
    <SpinnerWithChildren loading={isFetching}>
      <MultiLineChart data={data} xKey="x" series={series} />
    </SpinnerWithChildren>
  );
}
