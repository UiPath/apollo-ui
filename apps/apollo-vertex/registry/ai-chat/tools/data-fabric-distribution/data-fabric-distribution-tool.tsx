"use client";

import { toolDefinition } from "@tanstack/ai";
import { dataFabricAdapter } from "@uipath/apollo-dashboarding";
import { DateTime } from "luxon";
import { z } from "zod";
import { DistributionChartCard } from "../../charts/distribution-chart-card";
import { NoDataMessage } from "../../charts/no-data-message";
import {
  buildDistributionDataModel,
  collectQualifiedFields,
  type DataFabricToolContext,
  type DistributionAggregation,
  type Entity,
  type EntityField,
  filterSchema,
  generateEntityFieldsDocs,
  isNumericOrDatetime,
  joinSchema,
  mapFieldType,
  pickCountField,
  pickCountFieldQualified,
  resolveFilters,
} from "../data-fabric/shared";

const metricSchema = z
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

const dataFabricDistributionInput = z.object({
  entityName: z.string().describe("Data Fabric entity name to query"),
  dimension: z
    .string()
    .describe(
      "Field name to bin by. Must be a numeric or datetime field. When joining, use EntityName.Field format.",
    ),
  metric: metricSchema.optional(),
  filters: z
    .array(filterSchema)
    .optional()
    .describe("Optional filters to narrow down results."),
  joins: z
    .array(joinSchema)
    .optional()
    .describe(
      "Join other entities. Use EntityName.Field format for the dimension and metric field when joining.",
    ),
});

const dataFabricDistributionDef = toolDefinition({
  name: "data_fabric_distribution",
  description:
    "Render a distribution (histogram) chart from a Data Fabric entity, binning a numeric or datetime field. Supports optional metric (default COUNT), filters, and joins.",
  inputSchema: dataFabricDistributionInput,
  outputSchema: dataFabricDistributionInput,
  metadata: { skipFollowUp: true },
});

export const dataFabricDistributionClient = dataFabricDistributionDef.client(
  (input) => input,
);

type DistributionInput = z.infer<typeof dataFabricDistributionInput>;

interface ResolvedDimension {
  id: string;
  type: "numeric" | "datetime";
}

interface ResolvedMetric {
  field: string;
  aggregation: DistributionAggregation;
  display: string;
}

function resolveSingleDimension(
  entity: Entity,
  dimension: string,
): ResolvedDimension | null {
  const field = entity.fields.find((f) => f.name === dimension);
  if (!field || !isNumericOrDatetime(field)) return null;
  const type = mapFieldType(field.dataType);
  if (type !== "numeric" && type !== "datetime") return null;
  return { id: field.name, type };
}

function resolveMultiDimension(
  primaryEntity: string,
  dimension: string,
  qualifiedFields: Map<string, EntityField>,
): ResolvedDimension | null {
  const qualified = dimension.includes(".")
    ? dimension
    : `${primaryEntity}.${dimension}`;
  const field = qualifiedFields.get(qualified);
  if (!field || !isNumericOrDatetime(field)) return null;
  const type = mapFieldType(field.dataType);
  if (type !== "numeric" && type !== "datetime") return null;
  return { id: qualified, type };
}

function resolveSingleMetric(
  entity: Entity,
  metric: DistributionInput["metric"],
): ResolvedMetric | null {
  if (!metric || metric.aggregation === "COUNT") {
    const field =
      metric?.field && entity.fields.some((f) => f.name === metric.field)
        ? metric.field
        : pickCountField(entity);
    if (!field) return null;
    return { field, aggregation: "COUNT", display: "Count" };
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

function resolveMultiMetric(
  primaryEntity: string,
  metric: DistributionInput["metric"],
  qualifiedFields: Map<string, EntityField>,
): ResolvedMetric | null {
  if (!metric || metric.aggregation === "COUNT") {
    let field: string | null = null;
    if (metric?.field) {
      const qualified = metric.field.includes(".")
        ? metric.field
        : `${primaryEntity}.${metric.field}`;
      if (qualifiedFields.has(qualified)) field = qualified;
    }
    field ??= pickCountFieldQualified(primaryEntity, qualifiedFields);
    if (!field) return null;
    return { field, aggregation: "COUNT", display: "Count" };
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
    display: `${formatAggregation(metric.aggregation)} of ${qualified}`,
  };
}

function formatAggregation(aggregation: DistributionAggregation): string {
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

export function createDataFabricDistributionTool(
  context: DataFabricToolContext,
) {
  const today = DateTime.now().toISODate();
  const toolPrompt = `You have a "data_fabric_distribution" tool.
Use it to render a distribution (histogram) chart binning a single numeric or datetime field.

## Dimension
- Pass exactly one "dimension" — a field name. It MUST be a numeric or datetime field on the chosen entity (see Entity Reference).
- When the user explicitly names a field (e.g. "Distribution of EntityName.Field" or "distribution of <field>"), use EXACTLY that field as the dimension. Do not substitute a different field — even when joins are involved.
- Datetime dimensions bin by time (e.g. orders per month). Numeric dimensions bin by value range.
- If the user-named field is not numeric or datetime (e.g. a string like a name or a status), do NOT call this tool. Instead, reply explaining that distribution charts require a numeric or datetime field, and list the candidate numeric/datetime fields on that entity.
- Joins exist mainly to FILTER by a joined entity's attribute or to bin a numeric/datetime field that lives on a joined entity. They are NOT a reason to switch the dimension to a string field on the joined entity.

## Metric
- Omit "metric" entirely for the default COUNT of records per bin.
- For SUM/AVG/MIN/MAX, pass { aggregation, field } where "field" is a numeric field on the chosen entity.
- Pick SUM/AVG/MIN/MAX only when the user explicitly asks to aggregate a numeric field (e.g. "distribution of total order value by month" → SUM of OrderTotal). Otherwise default to COUNT.

## Filters
You can optionally pass filters to narrow results. Available filter types:
- **list**: match specific values. Use valueType matching the field type (string/number/boolean). Set invert=true to exclude.
- **search**: text pattern matching on string fields. searchFilterType: "default" (contains), "startsWith", "endsWith".
- **range** (numeric): use valueType="number" with min/max numbers.
- **range** (datetime): use valueType="datetime" with min/max as ISO 8601 strings (e.g. "2026-01-01" or "2026-01-01T00:00:00Z"). Today is ${today} — use it to resolve relative phrases like "last 30 days" or "this year" into absolute ISO dates before passing them.
Only add filters when the user asks to filter, search, or narrow results.

## Multi-Entity Joins
To bin a field that lives on a joined entity, add "joins" to link related entities. The entityName field is the primary entity.
When using joins, use qualified field names everywhere: "EntityName.FieldName" (using the EXACT entity names from the Entity Reference, never abbreviations or aliases).
Only use joins when the user explicitly asks to combine data from multiple entities.

## Entity Reference
${generateEntityFieldsDocs(context.entities)}`;

  function renderDistribution(output: DistributionInput, id: string) {
    const { entityName, dimension, metric, filters, joins } = output;
    const isMultiEntity = joins != null && joins.length > 0;

    const entity = context.entities[entityName];
    if (!entity) {
      return <NoDataMessage />;
    }

    const qualifiedFields = isMultiEntity
      ? collectQualifiedFields(
          [entityName, ...joins.map((j) => j.entity)],
          context.entities,
        )
      : null;

    const resolvedDimension = qualifiedFields
      ? resolveMultiDimension(entityName, dimension, qualifiedFields)
      : resolveSingleDimension(entity, dimension);

    const resolvedMetric = qualifiedFields
      ? resolveMultiMetric(entityName, metric, qualifiedFields)
      : resolveSingleMetric(entity, metric);

    if (!resolvedDimension || !resolvedMetric) {
      return <NoDataMessage />;
    }

    const dataModel = buildDistributionDataModel({
      id: entityName,
      dimension: resolvedDimension.id,
      dimensionType: resolvedDimension.type,
      metric: resolvedMetric,
    });

    const normalizedFilters = qualifiedFields
      ? resolveFilters(filters, {
          mode: "multi",
          primaryEntity: entityName,
          qualifiedFields,
        })
      : resolveFilters(filters, {
          mode: "single",
          validFields: entity.fields.map((f) => f.name),
        });

    const configuration = {
      id,
      name: entityName,
      type: "distribution" as const,
      dimensions: [resolvedDimension.id],
      metrics: [dataModel.metrics[0]?.id ?? ""],
      filters: normalizedFilters,
      ...(qualifiedFields &&
        joins && {
          from: { entity: entityName, alias: entityName },
          joins: joins.map((j) => ({ ...j, alias: j.entity })),
        }),
    };

    const adapter = dataFabricAdapter({
      baseUrl: context.dataFabricBaseUrl,
      accessToken: context.accessToken,
      entityName,
    });

    return (
      <DistributionChartCard
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={adapter}
      />
    );
  }

  return { toolPrompt, renderDistribution };
}
