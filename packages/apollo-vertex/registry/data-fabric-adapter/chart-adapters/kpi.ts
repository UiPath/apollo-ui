import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  type DataAdapter,
  type KpiChartData,
  mapConfigFilterToFilterValues,
} from "@/lib/charts-core";
import type { DataFabricQueryRequest } from "../schemas/query-schema";
import { mapMetricToDataFabricAggregate } from "../utils/metric-aggregate";
import { type DataFabricClient, dataFabricQuery } from "../utils/query";
import { createDataFabricChartQueryOptions } from "../utils/query-options";

export const dataFabricKpiChartAdapter = (
  client: DataFabricClient,
  entityName: string,
): DataAdapter["charts"]["kpi"] => {
  return (configuration, dataModel) => {
    const firstMetricId = assertDefined(
      configuration.metrics[0],
      "KPI chart must have at least one metric",
    );
    const firstMetric = assertDefined(
      dataModel.metrics.find((m) => m.id === firstMetricId),
      `Metric ${firstMetricId} not found in dataModel`,
    );
    const aggregate = mapMetricToDataFabricAggregate(firstMetric);

    const baseRequestBody = createDataFabricChartQueryOptions({
      selectedFields: [],
      sortBy: null,
      filters: (configuration.filters ?? []).map((f) =>
        mapConfigFilterToFilterValues(f),
      ),
    });

    const { selectedFields: _ignored, ...rest } = baseRequestBody;
    const requestBody: DataFabricQueryRequest = {
      ...rest,
      aggregates: [aggregate],
      joins: configuration.joins,
      from: configuration.from,
    };

    return queryOptions<KpiChartData, Error, KpiChartData, string[]>({
      queryKey: [entityName, "kpi", JSON.stringify(requestBody)],
      queryFn: async () => {
        const body = await dataFabricQuery(
          client,
          entityName,
          requestBody,
          "Failed to fetch KPI data",
        );

        const value =
          z
            .number()
            .nullable()
            .parse(body.value[0]?.[aggregate.alias] ?? null) ?? 0;

        return { data: [value], labels: [] };
      },
    });
  };
};
