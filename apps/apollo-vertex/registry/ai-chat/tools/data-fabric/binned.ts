import type {
  ChartDataModel,
  NumericOrDatetimeField,
} from "@uipath/apollo-dashboarding";
import { z } from "zod";
import {
  type Entity,
  type EntityField,
  mapFieldType,
  pickCountField,
  pickCountFieldQualified,
} from "./shared";

export type BinnedAggregation = "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";

export type BinnedDimensionType = "numeric" | "datetime";

interface BuildBinnedDataModelInput {
  id: string;
  dimension: string;
  dimensionType: BinnedDimensionType;
  metric: {
    aggregation: BinnedAggregation;
    field: string;
    display: string;
  };
}

// Data Fabric rewrites aliases that contain dots (qualified field paths)
// into a canonical `<FUNCTION>_<field>` form when joins are used, breaking
// the chart's `r[alias]` lookup. Sanitize the alias by replacing dots, so
// the server respects what we send. The `field` reference still needs to
// be qualified for the server to resolve the correct entity.
export function buildMetricEntry(metric: ResolvedMetric) {
  const aliasField = metric.field.replaceAll(".", "_");
  return {
    id: `${metric.aggregation.toLowerCase()}_${aliasField}`,
    display: metric.display,
    aggregation: metric.aggregation,
    field: metric.field,
  };
}

export function buildBinnedDataModel({
  id,
  dimension,
  dimensionType,
  metric,
}: BuildBinnedDataModelInput): ChartDataModel<NumericOrDatetimeField> {
  return {
    id,
    dimensions: [{ id: dimension, type: dimensionType }],
    metrics: [buildMetricEntry(metric)],
  };
}

interface BuildMultiBinnedDataModelInput {
  id: string;
  dimension: string;
  dimensionType: BinnedDimensionType;
  metrics: ResolvedMetric[];
}

export function buildMultiBinnedDataModel({
  id,
  dimension,
  dimensionType,
  metrics,
}: BuildMultiBinnedDataModelInput): ChartDataModel<NumericOrDatetimeField> {
  return {
    id,
    dimensions: [{ id: dimension, type: dimensionType }],
    metrics: metrics.map((m) => buildMetricEntry(m)),
  };
}

export const metricSchema = z
  .discriminatedUnion("aggregation", [
    z.object({
      aggregation: z.literal("COUNT"),
      field: z
        .string()
        .optional()
        .describe(
          "Field counted per bin. Optional — defaults to the entity primary key.",
        ),
    }),
    z.object({
      aggregation: z.enum(["SUM", "AVG", "MIN", "MAX"]),
      field: z
        .string()
        .describe(
          "Numeric field aggregated by the metric. Required for SUM/AVG/MIN/MAX.",
        ),
    }),
  ])
  .describe(
    "Metric to plot per bin. Omit entirely for the default COUNT of records.",
  );

export type MetricInput = z.infer<typeof metricSchema>;

export function formatAggregation(aggregation: BinnedAggregation): string {
  switch (aggregation) {
    case "COUNT":
      return "Count";
    case "SUM":
      return "Sum";
    case "AVG":
      return "Avg";
    case "MIN":
      return "Min";
    case "MAX":
      return "Max";
  }
}

export interface ResolvedDimension {
  id: string;
  type: BinnedDimensionType;
}

export interface ResolvedMetric {
  field: string;
  aggregation: BinnedAggregation;
  display: string;
}

export function resolveSingleBinnedDimension(
  entity: Entity,
  dimension: string,
  allowed: ReadonlyArray<BinnedDimensionType>,
): ResolvedDimension | null {
  const field = entity.fields.find((f) => f.name === dimension);
  if (!field) return null;
  const type = mapFieldType(field.dataType);
  if (type !== "numeric" && type !== "datetime") return null;
  if (!allowed.includes(type)) return null;
  return { id: field.name, type };
}

export function resolveMultiBinnedDimension(
  primaryEntity: string,
  dimension: string,
  qualifiedFields: Map<string, EntityField>,
  allowed: ReadonlyArray<BinnedDimensionType>,
): ResolvedDimension | null {
  const qualified = dimension.includes(".")
    ? dimension
    : `${primaryEntity}.${dimension}`;
  const field = qualifiedFields.get(qualified);
  if (!field) return null;
  const type = mapFieldType(field.dataType);
  if (type !== "numeric" && type !== "datetime") return null;
  if (!allowed.includes(type)) return null;
  return { id: qualified, type };
}

export function resolveSingleBinnedMetric(
  entity: Entity,
  metric: MetricInput | undefined,
): ResolvedMetric | null {
  if (!metric || metric.aggregation === "COUNT") {
    const userField =
      metric?.field && entity.fields.some((f) => f.name === metric.field)
        ? metric.field
        : null;
    const field = userField ?? pickCountField(entity);
    if (!field) return null;
    return {
      field,
      aggregation: "COUNT",
      display: userField ? `Count of ${userField}` : "Count",
    };
  }

  if (!metric.field) return null;
  const field = entity.fields.find((f) => f.name === metric.field);
  if (!field || field.dataType !== "number") return null;
  return {
    field: field.name,
    aggregation: metric.aggregation,
    display: `${formatAggregation(metric.aggregation)} of ${field.name}`,
  };
}

// Drop the entity prefix from a qualified `EntityName.Field` reference for use
// in human-facing labels (chart legend, totals title, tooltip). The qualified
// form is still required as the `field` for server-side resolution; only the
// display string is shortened, since the entity is implicit in the chart.
function unqualifiedDisplay(qualified: string): string {
  return qualified.split(".").at(-1) ?? qualified;
}

export function resolveMultiBinnedMetric(
  primaryEntity: string,
  metric: MetricInput | undefined,
  qualifiedFields: Map<string, EntityField>,
): ResolvedMetric | null {
  if (!metric || metric.aggregation === "COUNT") {
    let userField: string | null = null;
    if (metric?.field) {
      const qualified = metric.field.includes(".")
        ? metric.field
        : `${primaryEntity}.${metric.field}`;
      if (qualifiedFields.has(qualified)) userField = qualified;
    }
    const field =
      userField ?? pickCountFieldQualified(primaryEntity, qualifiedFields);
    if (!field) return null;
    return {
      field,
      aggregation: "COUNT",
      display: userField
        ? `Count of ${unqualifiedDisplay(userField)}`
        : "Count",
    };
  }

  if (!metric.field) return null;
  const qualified = metric.field.includes(".")
    ? metric.field
    : `${primaryEntity}.${metric.field}`;
  const field = qualifiedFields.get(qualified);
  if (!field || field.dataType !== "number") return null;
  return {
    field: qualified,
    aggregation: metric.aggregation,
    display: `${formatAggregation(metric.aggregation)} of ${unqualifiedDisplay(qualified)}`,
  };
}
