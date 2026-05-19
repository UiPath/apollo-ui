import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { assert } from "@/lib/asserts/assert";
import { assertDefined } from "@/lib/asserts/assert-defined";
import {
  type DataAdapter,
  type DistributionChartData,
  mapConfigFilterToFilterValues,
  niceNumbers,
} from "@/lib/charts-core";
import type { DataFabricQueryRequest } from "../schemas/query-schema";
import { buildNumericBins, createNumericBinning } from "../utils/binning-utils";
import { fetchDateBinnedData } from "../utils/fetch-date-binned-data";
import { mapFilterValuesToDataFabricFilterGroup } from "../utils/filter-group";
import { mapMetricToDataFabricAggregate } from "../utils/metric-aggregate";
import { type DataFabricClient, dataFabricQuery } from "../utils/query";

export const dataFabricDistributionChartAdapter = (
  client: DataFabricClient,
  entityName: string,
): DataAdapter["charts"]["distribution"] => {
  return (configuration, dataModel) => {
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
      "At least one metric is required",
    );
    const firstMetric = assertDefined(
      dataModel.metrics.find((m) => m.id === firstMetricId),
      `Metric ${firstMetricId} not found in dataModel`,
    );
    const aggregate = mapMetricToDataFabricAggregate(firstMetric);
    const filters = (configuration.filters ?? []).map((f) =>
      mapConfigFilterToFilterValues(f),
    );

    return queryOptions<
      DistributionChartData,
      Error,
      DistributionChartData,
      string[]
    >({
      queryKey: [
        entityName,
        "distribution",
        dimensionId,
        JSON.stringify(filters),
        JSON.stringify(aggregate),
        JSON.stringify(configuration.joins),
        JSON.stringify(configuration.from),
      ],
      queryFn: async () => {
        if (dimension.type === "datetime") {
          const result = await fetchDateBinnedData({
            client,
            entityName,
            dimensionId,
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
        }

        const baseFilterGroup = mapFilterValuesToDataFabricFilterGroup(filters);

        const minMaxBody: DataFabricQueryRequest = {
          aggregates: [
            { function: "MIN", field: dimensionId, alias: "min" },
            { function: "MAX", field: dimensionId, alias: "max" },
          ],
          filterGroup: baseFilterGroup,
          joins: configuration.joins,
          from: configuration.from,
        };

        const minMaxBodyResult = await dataFabricQuery(
          client,
          entityName,
          minMaxBody,
          "Failed to fetch min/max",
        );

        const row = minMaxBodyResult.value[0];
        const minVal = z
          .number()
          .nullable()
          .parse(row?.min ?? null);
        const maxVal = z
          .number()
          .nullable()
          .parse(row?.max ?? null);
        if (minVal == null || maxVal == null || minVal === maxVal) {
          return { values: [], bins: [] };
        }

        const { binSize } = niceNumbers({ min: minVal, max: maxVal });
        const existingFilters = baseFilterGroup?.queryFilters ?? [];

        const requestBody: DataFabricQueryRequest = {
          selectedFields: [dimensionId],
          aggregates: [aggregate],
          binnings: [createNumericBinning(dimensionId, binSize)],
          joins: configuration.joins,
          from: configuration.from,
          filterGroup: {
            logicalOperator: "and",
            queryFilters: [
              ...existingFilters,
              { fieldName: dimensionId, operator: ">=", value: String(minVal) },
              { fieldName: dimensionId, operator: "<=", value: String(maxVal) },
            ],
          },
          sortOptions: [{ fieldName: dimensionId, isDescending: false }],
          top: 1000,
          skip: 0,
        };

        const dataResult = await dataFabricQuery(
          client,
          entityName,
          requestBody,
          "Failed to fetch distribution data",
        );

        const rows = dataResult.value;
        const numericBinValues = rows.map((r) =>
          z.number().parse(r[dimensionId]),
        );
        const values = rows.map(
          (r) =>
            z
              .number()
              .nullable()
              .parse(r[aggregate.alias] ?? null) ?? 0,
        );

        return {
          values,
          bins: buildNumericBins(numericBinValues, binSize),
        };
      },
    });
  };
};
