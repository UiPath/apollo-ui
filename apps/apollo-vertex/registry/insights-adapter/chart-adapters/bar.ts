import { queryOptions } from "@tanstack/react-query";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  type DataAdapter,
  mapConfigFilterToFilterValues,
  mapResponseToChartData,
} from "@/lib/charts-core";
import { assertInsightsConfigurationSupported } from "../utils/assert-configuration-supported";
import { mapMetricToInsightsAggregate } from "../utils/metric-aggregate";
import { type InsightsClient, insightsQuery } from "../utils/query";
import { createInsightsChartQueryOptions } from "../utils/query-options";

export const insightsBarChartAdapter = (
  client: InsightsClient,
  sourceType: string,
): DataAdapter["charts"]["bar"] => {
  return (configuration, dataModel) => {
    assertInsightsConfigurationSupported(configuration);
    const dimensionIds = configuration.dimensions;
    const metrics = configuration.metrics.map((id) =>
      assertDefined(
        dataModel.metrics.find((m) => m.id === id),
        `Metric ${id} not found in dataModel`,
      ),
    );
    const aggregates = metrics.map((m) => mapMetricToInsightsAggregate(m));

    const requestBody = createInsightsChartQueryOptions({
      groupBy: dimensionIds,
      aggregates,
      sortBy: null,
      filters: (configuration.filters ?? []).map((f) =>
        mapConfigFilterToFilterValues(f),
      ),
      filterTableId: configuration.filterTableId,
    });

    return queryOptions({
      queryKey: [sourceType, "bar", JSON.stringify(requestBody)],
      queryFn: async () => {
        const body = await insightsQuery(
          client,
          sourceType,
          requestBody,
          "Failed to fetch bar chart data",
        );

        return mapResponseToChartData({
          data: body,
          dimensions: dimensionIds,
          metrics: aggregates.map((a) => a.id),
        });
      },
    });
  };
};
