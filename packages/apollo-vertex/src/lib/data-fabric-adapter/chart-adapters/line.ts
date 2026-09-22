import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { assert } from "@/lib/asserts/assert";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  type DataAdapter,
  type LineChartData,
  mapConfigFilterToFilterValues,
} from "@/lib/charts-core";
import { fetchDateBinnedData } from "../utils/fetch-date-binned-data";
import { mapMetricToDataFabricAggregate } from "../utils/metric-aggregate";
import type { DataFabricClient } from "../utils/query";

export const dataFabricLineChartAdapter = (
  client: DataFabricClient,
  entityName: string,
): DataAdapter["charts"]["line"] => {
  return (configuration, dataModel) => {
    const firstDimensionId = assertDefined(
      configuration.dimensions[0],
      "Line chart must have at least one dimension",
    );
    const firstDimension = assertDefined(
      dataModel.dimensions.find((d) => d.id === firstDimensionId),
      `Dimension ${firstDimensionId} not found in dataModel`,
    );
    const firstMetricId = assertDefined(
      configuration.metrics[0],
      "Line chart must have at least one metric",
    );
    const firstMetric = assertDefined(
      dataModel.metrics.find((m) => m.id === firstMetricId),
      `Metric ${firstMetricId} not found in dataModel`,
    );

    assert(
      firstDimension.type === "datetime",
      "Dimension type must be datetime",
    );

    const aggregate = mapMetricToDataFabricAggregate(firstMetric);
    const filters = (configuration.filters ?? []).map((f) =>
      mapConfigFilterToFilterValues(f),
    );

    return queryOptions<LineChartData, Error, LineChartData, string[]>({
      queryKey: [
        entityName,
        "line",
        firstDimension.id,
        JSON.stringify(filters),
        JSON.stringify(aggregate),
        JSON.stringify(configuration.joins),
        JSON.stringify(configuration.from),
      ],
      queryFn: async () => {
        const result = await fetchDateBinnedData({
          client,
          entityName,
          dimensionId: firstDimension.id,
          aggregates: [aggregate],
          filters,
          joins: configuration.joins,
          from: configuration.from,
        });

        if (!result) {
          return { values: [], bins: [] };
        }

        const values = result.rows.map(
          (r) =>
            z
              .number()
              .nullable()
              .parse(r[aggregate.alias] ?? null) ?? 0,
        );

        return { values, bins: result.bins };
      },
    });
  };
};
