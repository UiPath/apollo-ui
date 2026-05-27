import { queryOptions } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { z } from "zod";
import { assert } from "@/lib/asserts/assert";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  type DataAdapter,
  type LineChartData,
  mapConfigFilterToFilterValues,
} from "@/lib/charts-core";
import { assertInsightsConfigurationSupported } from "../utils/assert-configuration-supported";
import { calculateDatetimeBins, findBinCutoffPoints } from "../utils/binning";
import { mapMetricToInsightsAggregate } from "../utils/metric-aggregate";
import { type InsightsClient, insightsQuery } from "../utils/query";
import { createInsightsChartQueryOptions } from "../utils/query-options";

export const insightsLineChartAdapter = (
  client: InsightsClient,
  sourceType: string,
): DataAdapter["charts"]["line"] => {
  return (configuration, dataModel) => {
    assertInsightsConfigurationSupported(configuration);
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

    const aggregate = mapMetricToInsightsAggregate(firstMetric);
    const filters = (configuration.filters ?? []).map((f) =>
      mapConfigFilterToFilterValues(f),
    );
    const filterTableId = configuration.filterTableId;

    const minMaxRequest = createInsightsChartQueryOptions({
      groupBy: [],
      aggregates: [
        {
          id: "min",
          expression: {
            type: "aggregate",
            aggregation: "MIN",
            argument: firstDimension.id,
          },
        },
        {
          id: "max",
          expression: {
            type: "aggregate",
            aggregation: "MAX",
            argument: firstDimension.id,
          },
        },
      ],
      sortBy: null,
      filters,
      filterTableId,
    });

    return queryOptions<LineChartData, Error, LineChartData, string[]>({
      queryKey: [
        sourceType,
        "line",
        JSON.stringify(minMaxRequest),
        JSON.stringify(aggregate),
      ],
      queryFn: async () => {
        const response = await insightsQuery(
          client,
          sourceType,
          minMaxRequest,
          "Failed to fetch min/max",
        );

        const minStr = z
          .string()
          .nullable()
          .parse(response.min?.values?.[0] ?? null);
        const maxStr = z
          .string()
          .nullable()
          .parse(response.max?.values?.[0] ?? null);
        if (!minStr || !maxStr) {
          return { values: [], bins: [] };
        }

        const min = DateTime.fromISO(minStr, { zone: "utc" });
        const max = DateTime.fromISO(maxStr, { zone: "utc" });

        const bins = calculateDatetimeBins({ min, max });

        const cutoffPoints = findBinCutoffPoints(bins);
        if (cutoffPoints.length === 0) {
          return { values: [], bins: [] };
        }

        const binsRequest = createInsightsChartQueryOptions({
          groupBy: [],
          aggregates: [aggregate],
          sortBy: null,
          filters,
          filterTableId,
          binning: { bins: cutoffPoints, dimension: firstDimension.id },
        });

        const dataResponse = await insightsQuery(
          client,
          sourceType,
          binsRequest,
          "Failed to fetch line chart data",
        );

        const values =
          dataResponse[aggregate.id]?.values?.map(
            (value) => z.number().nullable().parse(value) ?? 0,
          ) ?? [];

        return { values, bins };
      },
    });
  };
};
