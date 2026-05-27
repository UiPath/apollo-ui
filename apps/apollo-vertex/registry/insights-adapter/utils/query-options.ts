import type { FilterValues } from "@/lib/charts-core";
import type { AggregateFragment } from "../schemas/aggregate-fragment-schema";
import type { InsightsQueryRequest } from "../schemas/query-schema";
import { mapFilterValuesToFilterRequest } from "./filter-request";

interface InsightsChartQueryOptions {
  groupBy: string[];
  aggregates?: AggregateFragment[];
  sortBy: { field: string; direction: "asc" | "desc" } | null;
  filters?: FilterValues[];
  filterTableId?: string;
  binning?: { dimension: string; bins: number[] };
}

export function createInsightsChartQueryOptions({
  groupBy,
  aggregates = [],
  sortBy,
  filters = [],
  filterTableId,
  binning,
}: InsightsChartQueryOptions): InsightsQueryRequest {
  return {
    filters: mapFilterValuesToFilterRequest(filters, filterTableId),
    groupBy,
    aggregates,
    ...(binning && {
      binning: {
        bins: binning.bins,
        dimension: binning.dimension,
        extraBins: "none" as const,
      },
    }),
    sort: sortBy ? [{ field: sortBy.field, direction: sortBy.direction }] : [],
  };
}
