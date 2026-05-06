"use client";

import { toolDefinition } from "@tanstack/ai";
import { dataFabricAdapter } from "@uipath/apollo-dashboarding";
import { DateTime } from "luxon";
import { z } from "zod";
import { DistributionChartCard } from "../../charts/distribution-chart-card";
import { ToolResolutionError } from "../../charts/tool-resolution-error";
import {
  buildDataModel,
  metricSchema,
  resolveMultiDimension,
  resolveMultiMetric,
  resolveSingleDimension,
  resolveSingleMetric,
} from "../data-fabric/util/chart-helpers";
import {
  collectQualifiedFields,
  type DataFabricToolContext,
  generateEntityFieldsDocs,
} from "../data-fabric/util/entities";
import { filterSchema, resolveFilters } from "../data-fabric/util/filters";
import { joinSchema } from "../data-fabric/util/joins";

const DISTRIBUTION_DIMENSION_TYPES = ["numeric", "datetime"] as const;

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
      return (
        <ToolResolutionError
          failure={{ reason: "unknown_entity", entity: entityName }}
        />
      );
    }

    const qualifiedFields = isMultiEntity
      ? collectQualifiedFields(
          [entityName, ...joins.map((j) => j.entity)],
          context.entities,
        )
      : null;

    const resolvedDimension = qualifiedFields
      ? resolveMultiDimension(
          entityName,
          dimension,
          qualifiedFields,
          DISTRIBUTION_DIMENSION_TYPES,
        )
      : resolveSingleDimension(entity, dimension, DISTRIBUTION_DIMENSION_TYPES);

    if (!resolvedDimension.ok) {
      return <ToolResolutionError failure={resolvedDimension} />;
    }

    const resolvedMetric = qualifiedFields
      ? resolveMultiMetric(entityName, metric, qualifiedFields)
      : resolveSingleMetric(entity, metric);

    if (!resolvedMetric.ok) {
      return <ToolResolutionError failure={resolvedMetric} />;
    }

    const dataModel = buildDataModel({
      id: entityName,
      dimension: resolvedDimension.value.id,
      dimensionType: resolvedDimension.value.type,
      metric: resolvedMetric.value,
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
      dimensions: [resolvedDimension.value.id],
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
