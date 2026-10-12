import { queryOptions } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { z } from "zod";
import { assert } from "@/lib/asserts/assert";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  type DataAdapter,
  type DistributionChartData,
  mapConfigFilterToFilterValues,
} from "@/lib/charts-core";
import { assertInsightsConfigurationSupported } from "../utils/assert-configuration-supported";
import {
  calculateDatetimeBins,
  calculateNumericBins,
  findBinCutoffPoints,
} from "../utils/binning";
import { mapMetricToInsightsAggregate } from "../utils/metric-aggregate";
import { type InsightsClient, insightsQuery } from "../utils/query";
import { createInsightsChartQueryOptions } from "../utils/query-options";

export const insightsDistributionChartAdapter = (
  client: InsightsClient,
  sourceType: string,
): DataAdapter["charts"]["distribution"] => {
  return (configuration, dataModel) => {
    assertInsightsConfigurationSupported(configuration);
    const dimensionId = assertDefined(
      configuration.dimensions[0],
      "Distribution chart must have at least one dimension",
    );
    const dimension = assertDefined(
      dataModel.dimensions.find((d) => d.id === dimensionId),
      `Dimension ${dimensionId} not found in dataModel`,
    );
    assert(
      dimension.type === "datetime" || dimension.type === "numeric",
      "Dimension type must be datetime or numeric",
    );

    const firstMetricId = assertDefined(
      configuration.metrics[0],
      "Distribution chart must have at least one metric",
    );
    const firstMetric = assertDefined(
      dataModel.metrics.find((m) => m.id === firstMetricId),
      `Metric ${firstMetricId} not found in dataModel`,
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
            argument: dimensionId,
          },
        },
        {
          id: "max",
          expression: {
            type: "aggregate",
            aggregation: "MAX",
            argument: dimensionId,
          },
        },
      ],
      sortBy: null,
      filters,
      filterTableId,
    });

    return queryOptions<
      DistributionChartData,
      Error,
      DistributionChartData,
      string[]
    >({
      queryKey: [
        sourceType,
        "distribution",
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

        const bins =
          dimension.type === "datetime"
            ? (() => {
                const minStr = z
                  .string()
                  .nullable()
                  .parse(response.min?.values?.[0] ?? null);
                const maxStr = z
                  .string()
                  .nullable()
                  .parse(response.max?.values?.[0] ?? null);
                if (!minStr || !maxStr) {
                  return null;
                }
                return calculateDatetimeBins({
                  min: DateTime.fromISO(minStr, { zone: "utc" }),
                  max: DateTime.fromISO(maxStr, { zone: "utc" }),
                });
              })()
            : (() => {
                const minNum = z
                  .number()
                  .nullable()
                  .parse(response.min?.values?.[0] ?? null);
                const maxNum = z
                  .number()
                  .nullable()
                  .parse(response.max?.values?.[0] ?? null);
                if (minNum == null || maxNum == null) {
                  return null;
                }
                return calculateNumericBins({ min: minNum, max: maxNum });
              })();

        if (!bins) {
          return { values: [], bins: [] };
        }

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
          binning: { bins: cutoffPoints, dimension: dimensionId },
        });

        const dataResponse = await insightsQuery(
          client,
          sourceType,
          binsRequest,
          "Failed to fetch distribution data",
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
