import { z } from "zod";
import {
  Aggregation,
  type ChartDataModel,
  type DataModelField,
  type DataModelMetric,
  type DimensionType,
} from "@/lib/charts-core";
import {
  type Entity,
  type EntityField,
  mapFieldType,
  pickCountField,
  pickCountFieldQualified,
} from "./entities";
import { fail, ok, type ResolverResult } from "./resolver-result";

// Data Fabric rewrites aliases that contain dots (qualified field paths)
// into a canonical `<FUNCTION>_<field>` form when joins are used, breaking
// the chart's `r[alias]` lookup. Sanitize the alias by replacing dots, so
// the server respects what we send. The `field` reference still needs to
// be qualified for the server to resolve the correct entity.
export function buildMetricEntry(metric: ResolvedMetric): DataModelMetric {
  const aliasField = metric.field.replaceAll(".", "_");
  return {
    id: `${metric.aggregation.kind}_${aliasField}`,
    display: metric.display,
    aggregation: metric.aggregation,
  };
}

interface BuildDataModelInput<T extends DimensionType> {
  id: string;
  dimension: string;
  dimensionType: T;
  metric: ResolvedMetric;
}

export function buildDataModel<T extends DimensionType>({
  id,
  dimension,
  dimensionType,
  metric,
}: BuildDataModelInput<T>): ChartDataModel<DataModelField & { type: T }> {
  return {
    id,
    dimensions: [{ id: dimension, type: dimensionType }],
    metrics: [buildMetricEntry(metric)],
  };
}

interface BuildMultiMetricDataModelInput<T extends DimensionType> {
  id: string;
  dimension: string;
  dimensionType: T;
  metrics: ResolvedMetric[];
}

export function buildMultiMetricDataModel<T extends DimensionType>({
  id,
  dimension,
  dimensionType,
  metrics,
}: BuildMultiMetricDataModelInput<T>): ChartDataModel<
  DataModelField & { type: T }
> {
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

export function formatAggregation(aggregation: Aggregation): string {
  switch (aggregation.kind) {
    case "count":
      return "Count";
    case "sum":
      return "Sum";
    case "avg":
      return "Avg";
    case "min":
      return "Min";
    case "max":
      return "Max";
  }
}

function metricInputToAggregation(
  input: MetricInput,
  field: string,
): Aggregation {
  switch (input.aggregation) {
    case "COUNT":
      return Aggregation.count(field);
    case "SUM":
      return Aggregation.sum(field);
    case "AVG":
      return Aggregation.avg(field);
    case "MIN":
      return Aggregation.min(field);
    case "MAX":
      return Aggregation.max(field);
  }
}

export interface ResolvedDimension<T extends DimensionType = DimensionType> {
  id: string;
  type: T;
}

export interface ResolvedMetric {
  field: string;
  aggregation: Aggregation;
  display: string;
}

export function dedupeMetrics(metrics: ResolvedMetric[]): ResolvedMetric[] {
  const seen = new Set<string>();
  return metrics.filter((m) => {
    const key = `${m.aggregation.kind}|${m.field}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isAllowedDimensionType<T extends DimensionType>(
  value: DimensionType,
  allowed: ReadonlyArray<T>,
): value is T {
  return (allowed as readonly DimensionType[]).includes(value);
}

export function resolveSingleDimension<T extends DimensionType>(
  entity: Entity,
  dimension: string,
  allowed: ReadonlyArray<T>,
): ResolverResult<ResolvedDimension<T>> {
  const field = entity.fields.find((f) => f.name === dimension);
  if (!field) {
    return fail({
      reason: "unknown_field_in_entity",
      field: dimension,
      entity: entity.name,
    });
  }
  const type = mapFieldType(field.dataType);
  if (!isAllowedDimensionType(type, allowed)) {
    return fail({
      reason: "wrong_dimension_type_in_entity",
      field: dimension,
      entity: entity.name,
      actual: field.dataType,
      expected: allowed.join(" or "),
    });
  }
  return ok({ id: field.name, type });
}

export function resolveMultiDimension<T extends DimensionType>(
  primaryEntity: string,
  dimension: string,
  qualifiedFields: Map<string, EntityField>,
  allowed: ReadonlyArray<T>,
): ResolverResult<ResolvedDimension<T>> {
  const qualified = dimension.includes(".")
    ? dimension
    : `${primaryEntity}.${dimension}`;
  const field = qualifiedFields.get(qualified);
  if (!field) {
    return fail({
      reason: "unknown_field_in_joined",
      field: qualified,
    });
  }
  const type = mapFieldType(field.dataType);
  if (!isAllowedDimensionType(type, allowed)) {
    return fail({
      reason: "wrong_dimension_type_in_joined",
      field: qualified,
      actual: field.dataType,
      expected: allowed.join(" or "),
    });
  }
  return ok({ id: qualified, type });
}

export function resolveSingleMetric(
  entity: Entity,
  metric: MetricInput | undefined,
): ResolverResult<ResolvedMetric> {
  if (!metric || metric.aggregation === "COUNT") {
    const userField =
      metric?.field && entity.fields.some((f) => f.name === metric.field)
        ? metric.field
        : null;
    const field = userField ?? pickCountField(entity);
    if (!field) {
      return fail({
        reason: "no_countable_in_entity",
        entity: entity.name,
      });
    }
    return ok({
      field,
      aggregation: Aggregation.count(field),
      display: userField ? `Count of ${userField}` : "Count",
    });
  }

  if (!metric.field) {
    return fail({
      reason: "missing_metric_field",
      aggregation: metric.aggregation,
    });
  }
  const field = entity.fields.find((f) => f.name === metric.field);
  if (!field) {
    return fail({
      reason: "unknown_field_in_entity",
      field: metric.field,
      entity: entity.name,
    });
  }
  if (field.dataType !== "number") {
    return fail({
      reason: "wrong_metric_type_in_entity",
      field: metric.field,
      entity: entity.name,
      actual: field.dataType,
      aggregation: metric.aggregation,
    });
  }
  const aggregation = metricInputToAggregation(metric, field.name);
  return ok({
    field: field.name,
    aggregation,
    display: `${formatAggregation(aggregation)} of ${field.name}`,
  });
}

// Drop the entity prefix from a qualified `EntityName.Field` reference for use
// in human-facing labels (chart legend, totals title, tooltip). The qualified
// form is still required as the `field` for server-side resolution; only the
// display string is shortened, since the entity is implicit in the chart.
function unqualifiedDisplay(qualified: string): string {
  return qualified.split(".").at(-1) ?? qualified;
}

export function resolveMultiMetric(
  primaryEntity: string,
  metric: MetricInput | undefined,
  qualifiedFields: Map<string, EntityField>,
): ResolverResult<ResolvedMetric> {
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
    if (!field) {
      return fail({
        reason: "no_countable_in_joined",
        primary: primaryEntity,
      });
    }
    return ok({
      field,
      aggregation: Aggregation.count(field),
      display: userField
        ? `Count of ${unqualifiedDisplay(userField)}`
        : "Count",
    });
  }

  if (!metric.field) {
    return fail({
      reason: "missing_metric_field",
      aggregation: metric.aggregation,
    });
  }
  const qualified = metric.field.includes(".")
    ? metric.field
    : `${primaryEntity}.${metric.field}`;
  const field = qualifiedFields.get(qualified);
  if (!field) {
    return fail({
      reason: "unknown_field_in_joined",
      field: qualified,
    });
  }
  if (field.dataType !== "number") {
    return fail({
      reason: "wrong_metric_type_in_joined",
      field: qualified,
      actual: field.dataType,
      aggregation: metric.aggregation,
    });
  }
  const aggregation = metricInputToAggregation(metric, qualified);
  return ok({
    field: qualified,
    aggregation,
    display: `${formatAggregation(aggregation)} of ${unqualifiedDisplay(qualified)}`,
  });
}
