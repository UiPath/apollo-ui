import { queryOptions } from "@tanstack/react-query";
import type { DataAdapter } from "@/lib/charts-core";
import { mapConfigFilterToFilterValues } from "@/lib/charts-core";
import { mapResponseToChartData } from "../utils/chart-data-mapper";
import { type DataFabricClient, dataFabricQuery } from "../utils/query";
import { createDataFabricChartQueryOptions } from "../utils/query-options";
import { mapDataFabricResponseToChartData } from "../utils/response-data-mapper";

export const dataFabricTableChartAdapter = (
  client: DataFabricClient,
  entityName: string,
): DataAdapter["charts"]["table"] => {
  return (configuration, _dataModel, state) => {
    const dimensionIds = configuration.dimensions;
    const requestBody = createDataFabricChartQueryOptions({
      selectedFields: dimensionIds,
      sortBy: state.sortBy,
      filters: (configuration.filters ?? []).map((f) =>
        mapConfigFilterToFilterValues(f),
      ),
    });

    const fullRequestBody = {
      ...requestBody,
      joins: configuration.joins,
      from: configuration.from,
    };

    return queryOptions({
      queryKey: [entityName, "query", JSON.stringify(fullRequestBody)],
      queryFn: async () => {
        const body = await dataFabricQuery(
          client,
          entityName,
          fullRequestBody,
          "Failed to fetch table data",
        );

        const columnOriented = mapDataFabricResponseToChartData(
          body,
          dimensionIds,
        );
        return mapResponseToChartData({
          data: columnOriented,
          dimensions: dimensionIds,
        });
      },
    });
  };
};
