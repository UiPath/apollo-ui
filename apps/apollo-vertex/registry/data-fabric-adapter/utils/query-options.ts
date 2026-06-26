import type { FilterValues } from "@/lib/charts-core";
import type { DataFabricQueryRequest } from "../schemas/query-schema";
import { mapFilterValuesToDataFabricFilterGroup } from "./filter-group";

interface DataFabricChartQueryOptions {
  selectedFields: string[];
  sortBy: { field: string; direction: "asc" | "desc" } | null;
  filters?: FilterValues[];
  skip?: number;
  top?: number;
}

export function createDataFabricChartQueryOptions({
  selectedFields,
  sortBy,
  filters = [],
  skip = 0,
  top = 100,
}: DataFabricChartQueryOptions): Omit<
  DataFabricQueryRequest,
  "aggregates" | "groupBy" | "binnings"
> {
  const result: Omit<
    DataFabricQueryRequest,
    "aggregates" | "groupBy" | "binnings"
  > = {
    selectedFields,
    skip,
    top,
    filterGroup: mapFilterValuesToDataFabricFilterGroup(filters),
  };
  if (sortBy) {
    result.sortOptions = [
      {
        fieldName: sortBy.field,
        isDescending: sortBy.direction === "desc",
      },
    ];
  }
  return result;
}
