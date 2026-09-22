import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  type DataAdapter,
  type KpiChartData,
  mapConfigFilterToFilterValues,
} from "@/lib/charts-core";
import { assertInsightsConfigurationSupported } from "../utils/assert-configuration-supported";
import { mapMetricToInsightsAggregate } from "../utils/metric-aggregate";
import { type InsightsClient, insightsQuery } from "../utils/query";
import { createInsightsChartQueryOptions } from "../utils/query-options";

export const insightsKpiChartAdapter = (
  client: InsightsClient,
  sourceType: string,
): DataAdapter["charts"]["kpi"] => {
  return (configuration, dataModel) => {
    assertInsightsConfigurationSupported(configuration);
    const firstMetricId = assertDefined(
      configuration.metrics[0],
      "KPI chart must have at least one metric",
    );
    const firstMetric = assertDefined(
      dataModel.metrics.find((m) => m.id === firstMetricId),
      `Metric ${firstMetricId} not found in dataModel`,
    );
    const aggregate = mapMetricToInsightsAggregate(firstMetric);

    const requestBody = createInsightsChartQueryOptions({
      groupBy: [],
      aggregates: [aggregate],
      sortBy: null,
      filters: (configuration.filters ?? []).map((f) =>
        mapConfigFilterToFilterValues(f),
      ),
      filterTableId: configuration.filterTableId,
    });

    return queryOptions<KpiChartData, Error, KpiChartData, string[]>({
      queryKey: [sourceType, "kpi", JSON.stringify(requestBody)],
      queryFn: async () => {
        const body = await insightsQuery(
          client,
          sourceType,
          requestBody,
          "Failed to fetch KPI data",
        );

        const value =
          z
            .number()
            .nullable()
            .parse(body[aggregate.id]?.values?.[0] ?? null) ?? 0;

        return { data: [value], labels: [] };
      },
    });
  };
};
