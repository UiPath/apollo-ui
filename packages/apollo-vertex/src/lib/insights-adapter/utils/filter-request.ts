import type { FilterValues } from "@/lib/charts-core";
import type {
  FilterFragment,
  ListFilterFragment,
  PeriodFilterFragment,
  RangeFilterFragment,
  SearchFilterFragment,
} from "../schemas/filter-fragment-schema";
import type { FilterRequest } from "../schemas/filter-request-schema";

function mapFilterValueToFragment(filterValue: FilterValues): FilterFragment {
  switch (filterValue.type) {
    case "list":
      return {
        values: filterValue.values,
        kind: "values",
        dimension: filterValue.field,
        type:
          filterValue.valueType === "number"
            ? "numeric"
            : filterValue.valueType,
        invert: filterValue.invert ?? false,
      } satisfies ListFilterFragment;
    case "search":
      return {
        pattern: filterValue.pattern,
        filterType: filterValue.searchFilterType,
        kind: "search",
        dimension: filterValue.field,
        type: "string",
        invert: false,
      } satisfies SearchFilterFragment;
    case "period":
      return {
        kind: "range",
        dimension: filterValue.field,
        type: "datetime",
        range: {
          inclusive: filterValue.range.inclusive ?? false,
          start: filterValue.range.min.toISO() ?? "",
          end: filterValue.range.max.toISO() ?? "",
        },
      } satisfies PeriodFilterFragment;
    case "range":
      return {
        kind: "range",
        dimension: filterValue.field,
        type: "numeric",
        range: {
          inclusive: filterValue.range.inclusive ?? false,
          ...(filterValue.range.min != null && {
            start: filterValue.range.min,
          }),
          ...(filterValue.range.max != null && {
            end: filterValue.range.max,
          }),
        },
      } satisfies RangeFilterFragment;
  }
}

export function mapFilterValuesToFragments(
  filterValues: FilterValues[],
): FilterFragment[] {
  return filterValues.map((f) => mapFilterValueToFragment(f));
}

export function mapFilterValuesToFilterRequest(
  filterValues: FilterValues[],
  filterTableId?: string,
): FilterRequest[][] {
  const filters = mapFilterValuesToFragments(filterValues);
  if (filters.length === 0) {
    return [];
  }

  if (!filterTableId) {
    return [filters];
  }

  return [
    [
      {
        kind: "tableWith",
        table: filterTableId,
        filters,
      },
    ],
  ];
}
