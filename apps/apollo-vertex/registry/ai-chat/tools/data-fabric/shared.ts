import type {
  ChartDataModel,
  NumericOrDatetimeField,
  TableChartConfiguration,
} from "@uipath/apollo-dashboarding";
import { DateTime } from "luxon";
import { z } from "zod";

export interface EntityField {
  name: string;
  dataType: "string" | "number" | "boolean" | "datetime";
  isPrimaryKey: boolean;
  isRequired: boolean;
}

export interface Entity {
  id: string;
  name: string;
  fields: readonly EntityField[];
}

export interface DataFabricToolContext {
  entities: Record<string, Entity>;
  accessToken: string;
  dataFabricBaseUrl: string;
}

export function mapFieldType(
  dataType: EntityField["dataType"],
): "string" | "numeric" | "boolean" | "datetime" {
  switch (dataType) {
    case "number":
      return "numeric";
    case "boolean":
      return "boolean";
    case "datetime":
      return "datetime";
    case "string":
      return "string";
  }
}

export function buildTableDataModel(entity: Entity) {
  return {
    id: entity.id,
    fields: entity.fields.map((field) => ({
      id: field.name,
      display: field.name,
      type: mapFieldType(field.dataType),
    })),
  };
}

export function collectQualifiedFields(
  entityNames: string[],
  entities: Record<string, Entity>,
): Map<string, EntityField> {
  const fields = new Map<string, EntityField>();
  for (const name of entityNames) {
    const entity = entities[name];
    if (!entity) continue;
    for (const field of entity.fields) {
      fields.set(`${name}.${field.name}`, field);
    }
  }
  return fields;
}

export function buildMultiEntityDataModel(
  id: string,
  dimensions: string[],
  fields: Map<string, EntityField>,
) {
  return {
    id,
    fields: dimensions.map((d) => {
      const field = fields.get(d);
      return {
        id: d,
        display: d,
        type: field ? mapFieldType(field.dataType) : ("string" as const),
      };
    }),
  };
}

export function validateDimensions(
  dimensions: string[],
  validNames: Iterable<string>,
): string[] {
  const valid = new Set(validNames);
  return dimensions.filter((d) => valid.has(d));
}

const isQualified = (field: string) => field.includes(".");

/**
 * Resolve a filter field for a multi-entity query. Returns the qualified
 * (`EntityName.Field`) form when it can be unambiguously determined, otherwise
 * null (unknown field, or unqualified name matches multiple joined entities).
 */
export function resolveQualifiedField(
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

export type ResolveFiltersOptions =
  | { mode: "single"; validFields: Iterable<string> }
  | {
      mode: "multi";
      primaryEntity: string;
      qualifiedFields: Map<string, EntityField>;
    };

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

export const joinSchema = z.object({
  type: z.enum(["INNER", "LEFT"]).describe("Join type"),
  entity: z.string().describe("Entity to join"),
  on: z.object({
    left: z
      .string()
      .describe("Field from the primary entity (EntityName.Field format)"),
    right: z
      .string()
      .describe("Field from the joined entity (EntityName.Field format)"),
  }),
});

export type JoinInput = z.infer<typeof joinSchema>;

export type ResolvedFilter = NonNullable<
  TableChartConfiguration["filters"]
>[number];

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
 * fields — same policy as `validateDimensions`, prevents hallucinated fields
 * from reaching the server. Also drops filters whose values fail to materialize
 * (e.g. unparseable datetime strings).
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

export function generateEntityFieldsDocs(
  entities: Record<string, Entity>,
): string {
  return Object.entries(entities)
    .map(([entityName, entity]) => {
      const fields = entity.fields
        .map((field) => `${field.name} (${field.dataType})`)
        .join(", ");
      return `${entityName}: ${fields}`;
    })
    .join("\n\n");
}

const NUMERIC_OR_DATETIME = new Set<EntityField["dataType"]>([
  "number",
  "datetime",
]);

export function isNumericOrDatetime(field: EntityField): boolean {
  return NUMERIC_OR_DATETIME.has(field.dataType);
}

export function pickCountField(entity: Entity): string | null {
  const pk = entity.fields.find((f) => f.isPrimaryKey);
  if (pk) return pk.name;
  const numeric = entity.fields.find((f) => f.dataType === "number");
  if (numeric) return numeric.name;
  return entity.fields[0]?.name ?? null;
}

export function pickCountFieldQualified(
  primaryEntity: string,
  qualifiedFields: Map<string, EntityField>,
): string | null {
  const primaryEntries = [...qualifiedFields.entries()].filter(([key]) =>
    key.startsWith(`${primaryEntity}.`),
  );
  const pk = primaryEntries.find(([, f]) => f.isPrimaryKey);
  if (pk) return pk[0];
  const numeric = primaryEntries.find(([, f]) => f.dataType === "number");
  if (numeric) return numeric[0];
  return primaryEntries[0]?.[0] ?? null;
}

export type DistributionAggregation = "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";

interface BuildDistributionDataModelInput {
  id: string;
  dimension: string;
  dimensionType: "numeric" | "datetime";
  metric: {
    aggregation: DistributionAggregation;
    field: string;
    display: string;
  };
}

export function buildDistributionDataModel({
  id,
  dimension,
  dimensionType,
  metric,
}: BuildDistributionDataModelInput): ChartDataModel<NumericOrDatetimeField> {
  // Data Fabric rewrites aliases that contain dots (qualified field paths)
  // into a canonical `<FUNCTION>_<field>` form when joins are used, breaking
  // the chart's `r[alias]` lookup. Sanitize the alias by replacing dots, so
  // the server respects what we send. The `field` reference still needs to
  // be qualified for the server to resolve the correct entity.
  const aliasField = metric.field.replaceAll(".", "_");
  return {
    id,
    dimensions: [{ id: dimension, type: dimensionType }],
    metrics: [
      {
        id: `${metric.aggregation.toLowerCase()}_${aliasField}`,
        display: metric.display,
        aggregation: metric.aggregation,
        field: metric.field,
      },
    ],
  };
}
