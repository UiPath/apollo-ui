import { queryOptions } from "@tanstack/react-query";
import {
  type DataAdapter,
  mapConfigFilterToFilterValues,
  mapResponseToChartData,
} from "@/lib/charts-core";
import { assertInsightsConfigurationSupported } from "../utils/assert-configuration-supported";
import { type InsightsClient, insightsQuery } from "../utils/query";
import { createInsightsChartQueryOptions } from "../utils/query-options";

export const insightsTableChartAdapter = (
  client: InsightsClient,
  sourceType: string,
): DataAdapter["charts"]["table"] => {
  return (configuration, _dataModel, state) => {
    assertInsightsConfigurationSupported(configuration);
    const dimensionIds = configuration.dimensions;
    const requestBody = createInsightsChartQueryOptions({
      groupBy: dimensionIds,
      sortBy: state.sortBy,
      filters: (configuration.filters ?? []).map((f) =>
        mapConfigFilterToFilterValues(f),
      ),
      filterTableId: configuration.filterTableId,
    });

    return queryOptions({
      queryKey: [sourceType, "table", JSON.stringify(requestBody)],
      queryFn: async () => {
        const body = await insightsQuery(
          client,
          sourceType,
          requestBody,
          "Failed to fetch table data",
        );

        return mapResponseToChartData({
          data: body,
          dimensions: dimensionIds,
        });
      },
    });
  };
};
