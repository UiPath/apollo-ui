import { queryOptions } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { z } from "zod";
import { assert } from "@/lib/asserts/assert";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  type DataAdapter,
  mapConfigFilterToFilterValues,
  type MultiLineChartData,
} from "@/lib/charts-core";
import { assertInsightsConfigurationSupported } from "../utils/assert-configuration-supported";
import { calculateDatetimeBins, findBinCutoffPoints } from "../utils/binning";
import { mapMetricToInsightsAggregate } from "../utils/metric-aggregate";
import { type InsightsClient, insightsQuery } from "../utils/query";
import { createInsightsChartQueryOptions } from "../utils/query-options";

export const insightsMultiLineChartAdapter = (
  client: InsightsClient,
  sourceType: string,
): DataAdapter["charts"]["multiLine"] => {
  return (configuration, dataModel) => {
    assertInsightsConfigurationSupported(configuration);
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
    const aggregates = metrics.map((m) => mapMetricToInsightsAggregate(m));
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

    return queryOptions<
      MultiLineChartData,
      Error,
      MultiLineChartData,
      string[]
    >({
      queryKey: [
        sourceType,
        "multi-line",
        JSON.stringify(minMaxRequest),
        ...aggregates.map((a) => JSON.stringify(a)),
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
          return { seriesByMetricId: {}, bins: [] };
        }

        const min = DateTime.fromISO(minStr, { zone: "utc" });
        const max = DateTime.fromISO(maxStr, { zone: "utc" });

        const bins = calculateDatetimeBins({ min, max });

        const cutoffPoints = findBinCutoffPoints(bins);
        if (cutoffPoints.length === 0) {
          return { seriesByMetricId: {}, bins: [] };
        }

        const results = await Promise.all(
          aggregates.map((agg) =>
            insightsQuery(
              client,
              sourceType,
              createInsightsChartQueryOptions({
                groupBy: [],
                aggregates: [agg],
                sortBy: null,
                filters,
                filterTableId,
                binning: { bins: cutoffPoints, dimension: firstDimension.id },
              }),
              "Failed to fetch multi-line chart data",
            ),
          ),
        );

        const seriesByMetricId: Record<string, number[]> = {};
        for (const [idx, agg] of aggregates.entries()) {
          const dataResponse = assertDefined(
            results[idx],
            "Missing results for metric",
          );
          seriesByMetricId[agg.id] =
            dataResponse[agg.id]?.values?.map(
              (value) => z.number().nullable().parse(value) ?? 0,
            ) ?? [];
        }

        return { seriesByMetricId, bins };
      },
    });
  };
};
