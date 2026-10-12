import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { assert } from "@/lib/asserts/assert";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  type DataAdapter,
  type MultiLineChartData,
  mapConfigFilterToFilterValues,
} from "@/lib/charts-core";
import { fetchDateBinnedData } from "../utils/fetch-date-binned-data";
import { mapMetricToDataFabricAggregate } from "../utils/metric-aggregate";
import type { DataFabricClient } from "../utils/query";

export const dataFabricMultiLineChartAdapter = (
  client: DataFabricClient,
  entityName: string,
): DataAdapter["charts"]["multiLine"] => {
  return (configuration, dataModel) => {
    const firstDimensionId = assertDefined(
      configuration.dimensions[0],
      "Multi line chart must have at least one dimension",
    );
    const firstDimension = assertDefined(
      dataModel.dimensions.find((d) => d.id === firstDimensionId),
      `Dimension ${firstDimensionId} not found in dataModel`,
    );

    assert(
      firstDimension.type === "datetime",
      "Dimension type must be datetime",
    );

    const metrics = configuration.metrics.map((id) =>
      assertDefined(
        dataModel.metrics.find((m) => m.id === id),
        `Metric ${id} not found in dataModel`,
      ),
    );
    const aggregates = metrics.map((m) => mapMetricToDataFabricAggregate(m));
    const filters = (configuration.filters ?? []).map((f) =>
      mapConfigFilterToFilterValues(f),
    );

    return queryOptions<
      MultiLineChartData,
      Error,
      MultiLineChartData,
      string[]
    >({
      queryKey: [
        entityName,
        "multiLine",
        firstDimension.id,
        JSON.stringify(filters),
        JSON.stringify(configuration.joins),
        JSON.stringify(configuration.from),
        ...aggregates.map((a) => JSON.stringify(a)),
      ],
      queryFn: async () => {
        const result = await fetchDateBinnedData({
          client,
          entityName,
          dimensionId: firstDimension.id,
          aggregates,
          filters,
          joins: configuration.joins,
          from: configuration.from,
        });

        if (!result) {
          return { seriesByMetricId: {}, bins: [] };
        }

        const seriesByMetricId: Record<string, number[]> = {};
        for (const agg of aggregates) {
          seriesByMetricId[agg.alias] = result.rows.map(
            (r) =>
              z
                .number()
                .nullable()
                .parse(r[agg.alias] ?? null) ?? 0,
          );
        }

        return { seriesByMetricId, bins: result.bins };
      },
    });
  };
};
