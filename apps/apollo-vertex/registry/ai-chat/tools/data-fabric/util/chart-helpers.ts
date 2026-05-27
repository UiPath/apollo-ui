import { z } from "zod";
import {
  type AggregationKind,
  buildField,
  type ChartDataModel,
  type DataModelField,
  type DataModelFieldType,
  type DataModelMetric,
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
  const aliasField = metric.argument.id.replaceAll(".", "_");
  return {
    id: `${metric.aggregation}_${aliasField}`,
    display: metric.display,
    expression: {
      type: "aggregate",
      aggregation: metric.aggregation,
      argument: metric.argument,
    },
  };
}

interface BuildDataModelInput<T extends DataModelFieldType> {
  id: string;
  dimension: string;
  dimensionType: T;
  metric: ResolvedMetric;
}

export function buildDataModel<T extends DataModelFieldType>({
  id,
  dimension,
  dimensionType,
  metric,
}: BuildDataModelInput<T>): ChartDataModel<
  Extract<DataModelField, { type: T }>
> {
  return {
    id,
    dimensions: [buildField(dimension, dimensionType)],
    metrics: [buildMetricEntry(metric)],
  };
}

interface BuildMultiMetricDataModelInput<T extends DataModelFieldType> {
  id: string;
  dimension: string;
  dimensionType: T;
  metrics: ResolvedMetric[];
}

export function buildMultiMetricDataModel<T extends DataModelFieldType>({
  id,
  dimension,
  dimensionType,
  metrics,
}: BuildMultiMetricDataModelInput<T>): ChartDataModel<
  Extract<DataModelField, { type: T }>
> {
  return {
    id,
    dimensions: [buildField(dimension, dimensionType)],
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

export function formatAggregation(aggregation: AggregationKind): string {
  switch (aggregation) {
    case "COUNT":
      return "Count";
    case "SUM":
      return "Sum";
    case "AVERAGE":
      return "Avg";
    case "MIN":
      return "Min";
    case "MAX":
      return "Max";
    case "ANY":
      return "Any";
    case "DISTINCT_COUNT":
      return "Distinct count";
    case "PERCENTAGE":
      return "Percentage";
    case "PERCENTILE":
      return "Percentile";
    case "MEDIAN":
      return "Median";
  }
}

function metricInputToAggregateType(input: MetricInput): AggregationKind {
  switch (input.aggregation) {
    case "COUNT":
      return "COUNT";
    case "SUM":
      return "SUM";
    case "AVG":
      return "AVERAGE";
    case "MIN":
      return "MIN";
    case "MAX":
      return "MAX";
  }
}

export interface ResolvedDimension<
  T extends DataModelFieldType = DataModelFieldType,
> {
  id: string;
  type: T;
}

export interface ResolvedMetric {
  argument: DataModelField;
  aggregation: AggregationKind;
  display: string;
}

export function dedupeMetrics(metrics: ResolvedMetric[]): ResolvedMetric[] {
  const seen = new Set<string>();
  return metrics.filter((m) => {
    const key = `${m.aggregation}|${m.argument.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isAllowedFieldType<T extends DataModelFieldType>(
  value: DataModelFieldType,
  allowed: ReadonlyArray<T>,
): value is T {
  return (allowed as readonly DataModelFieldType[]).includes(value);
}

export function resolveSingleDimension<T extends DataModelFieldType>(
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
  if (!isAllowedFieldType(type, allowed)) {
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

export function resolveMultiDimension<T extends DataModelFieldType>(
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
  if (!isAllowedFieldType(type, allowed)) {
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
    const fieldName = userField ?? pickCountField(entity);
    if (!fieldName) {
      return fail({
        reason: "no_countable_in_entity",
        entity: entity.name,
      });
    }
    const entityField = entity.fields.find((f) => f.name === fieldName);
    const type = entityField ? mapFieldType(entityField.dataType) : "string";
    return ok({
      argument: buildField(fieldName, type),
      aggregation: "COUNT",
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
  const aggregation = metricInputToAggregateType(metric);
  return ok({
    argument: buildField(field.name, "numeric"),
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
    const fieldName =
      userField ?? pickCountFieldQualified(primaryEntity, qualifiedFields);
    if (!fieldName) {
      return fail({
        reason: "no_countable_in_joined",
        primary: primaryEntity,
      });
    }
    const entityField = qualifiedFields.get(fieldName);
    const type = entityField ? mapFieldType(entityField.dataType) : "string";
    return ok({
      argument: buildField(fieldName, type),
      aggregation: "COUNT",
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
  const aggregation = metricInputToAggregateType(metric);
  return ok({
    argument: buildField(qualified, "numeric"),
    aggregation,
    display: `${formatAggregation(aggregation)} of ${unqualifiedDisplay(qualified)}`,
  });
}
