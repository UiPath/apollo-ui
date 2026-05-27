import { useIsFetching, useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";
import { useTranslation } from "react-i18next";
import { assertNumberOrNull } from "@/lib/asserts/assert-number-or-null";
import {
  type BarChartConfiguration,
  type BarChartData,
  type ChartDataModel,
  ChartLoadingBoundary,
  type DataAdapter,
  format,
  formatMetricValue,
  formatPercentage,
  SpinnerWithChildren,
  type StringModelField,
} from "@/lib/charts-core";
import {
  BarChart,
  type BarChartRow,
  type BarChartSeries,
} from "./bar-chart-view";
import { COLORS } from "./util/colors";

export interface BarChartWithAdapterProps {
  configuration: BarChartConfiguration;
  dataModel: ChartDataModel<StringModelField>;
  dataAdapter: DataAdapter;
}

export function BarChartWithAdapter({
  configuration,
  dataModel,
  dataAdapter,
}: BarChartWithAdapterProps) {
  return (
    <ChartLoadingBoundary configuration={configuration} dataModel={dataModel}>
      <BarChartResolver
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={dataAdapter}
      />
    </ChartLoadingBoundary>
  );
}

function BarChartResolver({
  configuration,
  dataModel,
  dataAdapter,
}: BarChartWithAdapterProps) {
  const {
    i18n: { language },
  } = useTranslation();

  const deferrableProps = useDeferredValue({
    configuration,
    dataModel,
    dataAdapter,
  });
  const query = dataAdapter.charts.bar(configuration, dataModel);
  const deferredQuery = deferrableProps.dataAdapter.charts.bar(
    deferrableProps.configuration,
    deferrableProps.dataModel,
  );

  const isFetching = useIsFetching(query) > 0;
  const dataset: BarChartData = useSuspenseQuery(deferredQuery).data;

  const dimensions = configuration.dimensions
    .map((id) => dataModel.dimensions.find((d) => d.id === id))
    .filter((d): d is NonNullable<typeof d> => d != null);
  const metrics = configuration.metrics
    .map((id) => dataModel.metrics.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => m != null);

  const totalsByMetricId = Object.fromEntries(
    metrics.map((m) => [
      m.id,
      dataset.reduce(
        (sum, row) =>
          sum + (assertNumberOrNull(row[m.id], "Metric value") ?? 0),
        0,
      ),
    ]),
  );

  const rows: BarChartRow[] = dataset.map((row, rowIdx) => {
    const rowDimensions = dimensions.map((d) => ({
      key: d.id,
      label: format(language, row[d.id], d.type) ?? "",
    }));
    const values: Record<string, number> = {};
    const formattedValues: Record<string, string> = {};
    const formattedPercents: Record<string, string> = {};
    for (const m of metrics) {
      const v = assertNumberOrNull(row[m.id], "Metric value") ?? 0;
      values[m.id] = v;
      formattedValues[m.id] = formatMetricValue(language, v, m.expression);
      const total = totalsByMetricId[m.id] ?? 0;
      formattedPercents[m.id] =
        total === 0 ? "" : formatPercentage(language, v / total);
    }
    return {
      id: `${rowIdx}-${rowDimensions.map((d) => d.label).join("|")}`,
      dimensions: rowDimensions,
      values,
      formattedValues,
      formattedPercents,
    };
  });

  const series: BarChartSeries[] = metrics.map((m, idx) => ({
    id: m.id,
    label: m.display,
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <SpinnerWithChildren loading={isFetching}>
      <BarChart rows={rows} series={series} />
    </SpinnerWithChildren>
  );
}
