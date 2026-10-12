import type { DateTime } from "luxon";

type FilterType = "range" | "list" | "search" | "period";

interface BaseFilter {
  type: FilterType;
}

export interface PeriodFilterValues extends BaseFilter {
  type: "period";
  field: string;
  range: { min: DateTime; max: DateTime; inclusive?: boolean };
}

export interface NumberRangeFilterValues extends BaseFilter {
  type: "range";
  field: string;
  range:
    | { min: number; max?: number; inclusive?: boolean }
    | { min?: number; max: number; inclusive?: boolean };
}

export interface StringSearchFilterValues extends BaseFilter {
  type: "search";
  field: string;
  pattern: string;
  searchFilterType: "default" | "startsWith" | "endsWith";
}

interface ListFilterBase extends BaseFilter {
  type: "list";
  field: string;
  invert?: boolean;
}

export interface StringListFilterValues extends ListFilterBase {
  valueType: "string";
  values: (string | null)[];
}

export interface BooleanListFilterValues extends ListFilterBase {
  valueType: "boolean";
  values: (boolean | null)[];
}

export interface NumberListFilterValues extends ListFilterBase {
  valueType: "number";
  values: (number | null)[];
}

export type ListFilterValues =
  | StringListFilterValues
  | BooleanListFilterValues
  | NumberListFilterValues;

export type FilterValues =
  | PeriodFilterValues
  | NumberRangeFilterValues
  | ListFilterValues
  | StringSearchFilterValues;
