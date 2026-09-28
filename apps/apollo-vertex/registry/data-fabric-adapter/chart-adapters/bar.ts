import { queryOptions } from "@tanstack/react-query";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  type DataAdapter,
  mapConfigFilterToFilterValues,
  mapResponseToChartData,
} from "@/lib/charts-core";
import type { DataFabricQueryRequest } from "../schemas/query-schema";
import { mapMetricToDataFabricAggregate } from "../utils/metric-aggregate";
import { type DataFabricClient, dataFabricQuery } from "../utils/query";
import { createDataFabricChartQueryOptions } from "../utils/query-options";
import { mapDataFabricResponseToChartData } from "../utils/response-data-mapper";

export const dataFabricBarChartAdapter = (
  client: DataFabricClient,
  entityName: string,
): DataAdapter["charts"]["bar"] => {
  return (configuration, dataModel) => {
    const dimensionIds = configuration.dimensions;
    const metricIds = configuration.metrics;
    const metrics = metricIds.map((id) =>
      assertDefined(
        dataModel.metrics.find((m) => m.id === id),
        `Metric ${id} not found in dataModel`,
      ),
    );
    const aggregates = metrics.map((m) => mapMetricToDataFabricAggregate(m));

    const baseRequestBody = createDataFabricChartQueryOptions({
      selectedFields: dimensionIds,
      sortBy: null,
      filters: (configuration.filters ?? []).map((f) =>
        mapConfigFilterToFilterValues(f),
      ),
    });

    const requestBody: DataFabricQueryRequest = {
      ...baseRequestBody,
      groupBy: dimensionIds,
      aggregates,
      joins: configuration.joins,
      from: configuration.from,
    };

    return queryOptions({
      queryKey: [entityName, "query", JSON.stringify(requestBody)],
      queryFn: async () => {
        const body = await dataFabricQuery(
          client,
          entityName,
          requestBody,
          "Failed to fetch bar chart data",
        );

        const allFieldIds = [
          ...dimensionIds,
          ...aggregates.map((a) => a.alias),
        ];
        const columnOriented = mapDataFabricResponseToChartData(
          body,
          allFieldIds,
        );
        return mapResponseToChartData({
          data: columnOriented,
          dimensions: dimensionIds,
          metrics: aggregates.map((a) => a.alias),
        });
      },
    });
  };
};
