import { DateTime, type Interval } from "luxon";
import { z } from "zod";
import {
  type FilterValues,
  type FromConfig,
  type JoinConfig,
  niceDurationNumbers,
} from "@/lib/charts-core";
import type { DataFabricQueryRequest } from "../schemas/query-schema";
import {
  buildIntervalsFromDateBins,
  createDateBinning,
  durationToDateBinUnit,
} from "./binning-utils";
import { mapFilterValuesToDataFabricFilterGroup } from "./filter-group";
import type { DataFabricAggregate } from "./metric-aggregate";
import { type DataFabricClient, dataFabricQuery } from "./query";

type DataModelAggregate = DataFabricAggregate;

interface FetchDateBinnedDataOptions {
  client: DataFabricClient;
  entityName: string;
  dimensionId: string;
  aggregates: DataModelAggregate[];
  filters: FilterValues[];
  joins?: JoinConfig[];
  from?: FromConfig;
}

interface DateBinnedResult {
  bins: Interval[];
  rows: Record<string, unknown>[];
}

export async function fetchDateBinnedData({
  client,
  entityName,
  dimensionId,
  aggregates,
  filters,
  joins,
  from,
}: FetchDateBinnedDataOptions): Promise<DateBinnedResult | null> {
  const baseFilterGroup = mapFilterValuesToDataFabricFilterGroup(filters);

  const minMaxBody: DataFabricQueryRequest = {
    aggregates: [
      { function: "MIN", field: dimensionId, alias: "min" },
      { function: "MAX", field: dimensionId, alias: "max" },
    ],
    filterGroup: baseFilterGroup,
    joins,
    from,
  };

  const minMaxResult = await dataFabricQuery(
    client,
    entityName,
    minMaxBody,
    "Failed to fetch min/max",
  );

  const row = minMaxResult.value[0];
  if (!row) {
    throw new Error("Min/max query returned no results");
  }

  const minStr = z
    .string()
    .nullable()
    .parse(row.min ?? null);
  const maxStr = z
    .string()
    .nullable()
    .parse(row.max ?? null);
  if (!minStr || !maxStr) {
    throw new Error("Min/max query returned null values");
  }

  const min = DateTime.fromISO(minStr, { zone: "utc" });
  const max = DateTime.fromISO(maxStr, { zone: "utc" });

  if (min.equals(max)) return null;

  const bestDuration = niceDurationNumbers({ min, max });
  const dateBinUnit = durationToDateBinUnit(bestDuration);
  const binning = createDateBinning(dimensionId, dateBinUnit);

  const minIso = min.toISO() ?? minStr;
  const maxIso = max.toISO() ?? maxStr;

  const existingFilters = baseFilterGroup?.queryFilters ?? [];

  const requestBody: DataFabricQueryRequest = {
    selectedFields: [dimensionId],
    aggregates,
    binnings: [binning],
    joins,
    from,
    filterGroup: {
      logicalOperator: "and",
      queryFilters: [
        ...existingFilters,
        {
          fieldName: dimensionId,
          operator: ">=",
          value: minIso,
        },
        {
          fieldName: dimensionId,
          operator: "<=",
          value: maxIso,
        },
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
    "Failed to fetch binned data",
  );

  const rows = dataResult.value;
  const dateBinValues = rows.map((r) => z.string().parse(r[dimensionId]));
  const bins = buildIntervalsFromDateBins(dateBinValues, dateBinUnit);

  return { bins, rows };
}
