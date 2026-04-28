"use client";

import { toolDefinition } from "@tanstack/ai";
import { dataFabricAdapter } from "@uipath/apollo-dashboarding";
import { DateTime } from "luxon";
import { z } from "zod";
import { LineChartCard } from "../../charts/line-chart-card";
import { NoDataMessage } from "../../charts/no-data-message";
import {
  buildBinnedDataModel,
  metricSchema,
  resolveMultiBinnedDimension,
  resolveMultiBinnedMetric,
  resolveSingleBinnedDimension,
  resolveSingleBinnedMetric,
} from "../data-fabric/binned";
import {
  collectQualifiedFields,
  type DataFabricToolContext,
  filterSchema,
  generateEntityFieldsDocs,
  joinSchema,
  resolveFilters,
} from "../data-fabric/shared";

const LINE_DIMENSION_TYPES = ["datetime"] as const;

const dataFabricLineInput = z.object({
  entityName: z.string().describe("Data Fabric entity name to query"),
  dimension: z
    .string()
    .describe(
      "Datetime field name to bin the time axis by. When joining, use EntityName.Field format.",
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

const dataFabricLineDef = toolDefinition({
  name: "data_fabric_line",
  description:
    "Render a line chart from a Data Fabric entity, plotting a metric over a datetime dimension. Supports optional metric (default COUNT), filters, and joins.",
  inputSchema: dataFabricLineInput,
  outputSchema: dataFabricLineInput,
  metadata: { skipFollowUp: true },
});

export const dataFabricLineClient = dataFabricLineDef.client((input) => input);

type LineInput = z.infer<typeof dataFabricLineInput>;

export function createDataFabricLineTool(context: DataFabricToolContext) {
  const today = DateTime.now().toISODate();
  const toolPrompt = `You have a "data_fabric_line" tool.
Use it to render a line chart that plots a metric over time, binning a datetime field on the X axis.

## Dimension
- Pass exactly one "dimension" — a datetime field name on the chosen entity (see Entity Reference). The field MUST be a datetime field; do NOT use this tool with a numeric or string dimension.
- When the user explicitly names a field (e.g. "<metric> over EntityName.Field"), use EXACTLY that field as the dimension. Do not substitute a different field — even when joins are involved.
- If the user-named field is not a datetime field, do NOT call this tool. Reply explaining that line charts require a datetime field, and list the candidate datetime fields on that entity.

## Metric
- Omit "metric" entirely for the default COUNT of records per time bucket.
- For SUM/AVG/MIN/MAX, pass { aggregation, field } where "field" is a numeric field on the chosen entity.
- Pick SUM/AVG/MIN/MAX only when the user explicitly asks to aggregate a numeric field (e.g. "total order value over time" → SUM of OrderTotal). Otherwise default to COUNT.

## Filters
You can optionally pass filters to narrow results. Available filter types:
- **list**: match specific values. Use valueType matching the field type (string/number/boolean). Set invert=true to exclude.
- **search**: text pattern matching on string fields. searchFilterType: "default" (contains), "startsWith", "endsWith".
- **range** (numeric): use valueType="number" with min/max numbers.
- **range** (datetime): use valueType="datetime" with min/max as ISO 8601 strings (e.g. "2026-01-01" or "2026-01-01T00:00:00Z"). Today is ${today} — use it to resolve relative phrases like "last 30 days" or "this year" into absolute ISO dates before passing them.
Only add filters when the user asks to filter, search, or narrow results.

## Multi-Entity Joins
To bin a datetime field that lives on a joined entity, or to aggregate a numeric field from a joined entity, add "joins" to link related entities. The entityName field is the primary entity.
When using joins, use qualified field names everywhere: "EntityName.FieldName" (using the EXACT entity names from the Entity Reference, never abbreviations or aliases).
Only use joins when the user explicitly asks to combine data from multiple entities.

## Entity Reference
${generateEntityFieldsDocs(context.entities)}`;

  function renderLine(output: LineInput, id: string) {
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
      ? resolveMultiBinnedDimension(
          entityName,
          dimension,
          qualifiedFields,
          LINE_DIMENSION_TYPES,
        )
      : resolveSingleBinnedDimension(entity, dimension, LINE_DIMENSION_TYPES);

    const resolvedMetric = qualifiedFields
      ? resolveMultiBinnedMetric(entityName, metric, qualifiedFields)
      : resolveSingleBinnedMetric(entity, metric);

    if (!resolvedDimension || !resolvedMetric) {
      return <NoDataMessage />;
    }

    const dataModel = buildBinnedDataModel({
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
      type: "line" as const,
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
      <LineChartCard
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={adapter}
      />
    );
  }

  return { toolPrompt, renderLine };
}
