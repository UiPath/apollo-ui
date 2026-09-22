import { DateTime } from "luxon";
import { z } from "zod";
import type { TableChartConfiguration } from "@/lib/charts-core";
import type { EntityField } from "./entities";

const stringListFilterSchema = z.object({
  type: z.literal("list"),
  field: z.string().describe("Field name to filter on"),
  valueType: z.literal("string"),
  values: z.array(z.union([z.string(), z.null()])).describe("Values to match"),
  invert: z
    .boolean()
    .optional()
    .describe("If true, exclude matching values instead"),
});

const numberListFilterSchema = z.object({
  type: z.literal("list"),
  field: z.string().describe("Field name to filter on"),
  valueType: z.literal("number"),
  values: z.array(z.union([z.number(), z.null()])).describe("Values to match"),
  invert: z
    .boolean()
    .optional()
    .describe("If true, exclude matching values instead"),
});

const booleanListFilterSchema = z.object({
  type: z.literal("list"),
  field: z.string().describe("Field name to filter on"),
  valueType: z.literal("boolean"),
  values: z.array(z.union([z.boolean(), z.null()])).describe("Values to match"),
  invert: z
    .boolean()
    .optional()
    .describe("If true, exclude matching values instead"),
});

const searchFilterSchema = z.object({
  type: z.literal("search"),
  field: z.string().describe("String field name to search"),
  valueType: z.literal("string"),
  pattern: z.string().describe("Text pattern to match"),
  searchFilterType: z
    .enum(["default", "startsWith", "endsWith"])
    .describe("default = contains"),
});

const numberRangeFilterSchema = z.object({
  type: z.literal("range"),
  field: z.string().describe("Numeric field name"),
  valueType: z.literal("number"),
  range: z.union([
    z.object({
      min: z.number().describe("Minimum value (inclusive)"),
      max: z.number().optional().describe("Maximum value (inclusive)"),
      inclusive: z.boolean().optional(),
    }),
    z.object({
      min: z.number().optional().describe("Minimum value (inclusive)"),
      max: z.number().describe("Maximum value (inclusive)"),
      inclusive: z.boolean().optional(),
    }),
  ]),
});

const datetimeRangeFilterSchema = z.object({
  type: z.literal("range"),
  field: z.string().describe("Datetime field name"),
  valueType: z.literal("datetime"),
  range: z.object({
    min: z
      .string()
      .describe("ISO 8601 datetime, inclusive lower bound (e.g. 2026-01-01)"),
    max: z
      .string()
      .describe("ISO 8601 datetime, inclusive upper bound (e.g. 2026-12-31)"),
    inclusive: z.boolean().optional(),
  }),
});

export const filterSchema = z
  .union([
    stringListFilterSchema,
    numberListFilterSchema,
    booleanListFilterSchema,
    searchFilterSchema,
    numberRangeFilterSchema,
    datetimeRangeFilterSchema,
  ])
  .describe("Filter to apply to the query");

export type FilterInput = z.infer<typeof filterSchema>;

export type ResolvedFilter = NonNullable<
  TableChartConfiguration["filters"]
>[number];

export type ResolveFiltersOptions =
  | { mode: "single"; validFields: Iterable<string> }
  | {
      mode: "multi";
      primaryEntity: string;
      qualifiedFields: Map<string, EntityField>;
    };

const isQualified = (field: string) => field.includes(".");

/**
 * Resolve a filter field for a multi-entity query. Returns the qualified
 * (`EntityName.Field`) form when it can be unambiguously determined, otherwise
 * null (unknown field, or unqualified name matches multiple joined entities).
 */
function resolveQualifiedField(
  field: string,
  primaryEntity: string,
  qualifiedFields: Map<string, EntityField>,
): string | null {
  if (isQualified(field)) {
    return qualifiedFields.has(field) ? field : null;
  }

  const primary = `${primaryEntity}.${field}`;
  if (qualifiedFields.has(primary)) return primary;

  const suffix = `.${field}`;
  const matches = [...qualifiedFields.keys()].filter((k) => k.endsWith(suffix));
  return matches.length === 1 ? (matches[0] ?? null) : null;
}

function fieldResolver(
  options: ResolveFiltersOptions,
): (field: string) => string | null {
  if (options.mode === "single") {
    const valid = new Set(options.validFields);
    return (f) => (valid.has(f) ? f : null);
  }
  const { primaryEntity, qualifiedFields } = options;
  return (f) => resolveQualifiedField(f, primaryEntity, qualifiedFields);
}

/**
 * Convert a tool-input filter (ISO datetime strings on the wire) to the chart
 * configuration filter shape the dashboarding library expects. Datetime range
 * filters are materialized to luxon `DateTime` instances; other branches pass
 * through unchanged. Returns null if the input cannot be materialized (e.g. an
 * unparseable ISO string), so the caller can drop it.
 */
function materializeFilter(filter: FilterInput): ResolvedFilter | null {
  if (filter.type === "range" && filter.valueType === "datetime") {
    const min = DateTime.fromISO(filter.range.min);
    const max = DateTime.fromISO(filter.range.max);
    if (!min.isValid || !max.isValid) return null;
    return {
      type: "range",
      valueType: "datetime",
      field: filter.field,
      range: {
        min,
        max,
        inclusive: filter.range.inclusive,
      },
    };
  }
  return filter;
}

/**
 * Validate & qualify filter fields, then materialize values (e.g. ISO datetime
 * strings → luxon `DateTime`). Drops filters referencing unknown or ambiguous
 * fields, preventing hallucinated fields from reaching the server. Also drops
 * filters whose values fail to materialize (e.g. unparseable datetime strings).
 */
export function resolveFilters(
  filters: FilterInput[] | undefined,
  options: ResolveFiltersOptions,
): ResolvedFilter[] | undefined {
  if (!filters) return filters;
  const resolve = fieldResolver(options);
  return filters.flatMap((f) => {
    const field = resolve(f.field);
    if (!field) return [];
    const materialized = materializeFilter({ ...f, field });
    return materialized ? [materialized] : [];
  });
}
