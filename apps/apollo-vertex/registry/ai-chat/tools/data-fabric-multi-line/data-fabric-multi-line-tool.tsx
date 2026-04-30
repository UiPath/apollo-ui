"use client";

import { toolDefinition } from "@tanstack/ai";
import { dataFabricAdapter } from "@uipath/apollo-dashboarding";
import { DateTime } from "luxon";
import { z } from "zod";
import { MultiLineChartCard } from "../../charts/multi-line-chart-card";
import { NoDataMessage } from "../../charts/no-data-message";
import {
  buildMultiBinnedDataModel,
  metricSchema,
  type ResolvedMetric,
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

const MULTI_LINE_DIMENSION_TYPES = ["datetime"] as const;

const dataFabricMultiLineInput = z.object({
  entityName: z.string().describe("Data Fabric entity name to query"),
  dimension: z
    .string()
    .describe(
      "Datetime field name to bin the time axis by. When joining, use EntityName.Field format.",
    ),
  metrics: z
    .array(metricSchema)
    .min(2)
    .max(2)
    .refine(
      (metrics) => {
        const keys = new Set(
          metrics.map((m) => `${m.aggregation}|${m.field ?? ""}`),
        );
        return keys.size === metrics.length;
      },
      {
        message:
          "Metrics must have distinct (aggregation, field) pairs — pick two different metrics to compare.",
      },
    )
    .describe(
      "Exactly two metrics with distinct (aggregation, field) pairs, plotted as separate lines on a shared time axis. The first metric uses the left Y axis; the second uses the right.",
    ),
  filters: z
    .array(filterSchema)
    .optional()
    .describe("Optional filters to narrow down results."),
  joins: z
    .array(joinSchema)
    .optional()
    .describe(
      "Join other entities. Use EntityName.Field format for the dimension and metric fields when joining.",
    ),
});

const dataFabricMultiLineDef = toolDefinition({
  name: "data_fabric_multi_line",
  description:
    "Render a multi-line chart from a Data Fabric entity, plotting exactly two metrics over a datetime dimension on a shared X axis (one per Y axis: left and right). Use when the user wants to compare two metrics over time.",
  inputSchema: dataFabricMultiLineInput,
  outputSchema: dataFabricMultiLineInput,
  metadata: { skipFollowUp: true },
});

export const dataFabricMultiLineClient = dataFabricMultiLineDef.client(
  (input) => input,
);

type MultiLineInput = z.infer<typeof dataFabricMultiLineInput>;

function dedupeMetrics(metrics: ResolvedMetric[]): ResolvedMetric[] {
  const seen = new Set<string>();
  return metrics.filter((m) => {
    const key = `${m.aggregation}|${m.field}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function createDataFabricMultiLineTool(context: DataFabricToolContext) {
  const today = DateTime.now().toISODate();
  const toolPrompt = `You have a "data_fabric_multi_line" tool.
Use it to render a multi-line chart that plots EXACTLY TWO metrics over time on a shared datetime X axis.

## When to use multi-line vs line
- Use "data_fabric_multi_line" when the user asks to compare two metrics on the same time axis (e.g. "orders count and revenue over time", "min vs max price by month", "sum of A and sum of B per quarter").
- Use "data_fabric_line" when there is only ONE metric to plot. Do NOT call multi-line with a single metric.
- The chart only supports 2 metrics: the FIRST metric uses the LEFT Y axis (and its color/totals label), the SECOND uses the RIGHT. If the user asks to compare 3+ metrics, ask them to pick the two most important and offer to render the others in follow-up charts — do NOT pass more than 2.

## Dimension
- Pass exactly one "dimension" — a datetime field name on the chosen entity (see Entity Reference). The field MUST be a datetime field; do NOT use this tool with a numeric or string dimension.
- When the user explicitly names a field (e.g. "<metric_a> and <metric_b> over EntityName.Field"), use EXACTLY that field as the dimension.
- If the user-named field is not a datetime field, do NOT call this tool. Reply explaining that line charts require a datetime field, and list the candidate datetime fields on that entity.

## Metrics
- Pass an array of EXACTLY TWO metrics with distinct (aggregation, field) pairs. Each entry follows the same shape as the line tool:
  - For COUNT, pass { aggregation: "COUNT" } — "field" is optional and defaults to the entity primary key.
  - For SUM/AVG/MIN/MAX, pass { aggregation, field } where "field" is a numeric field on the chosen entity.
- Pick only metrics the user asked to compare. Do not invent extra metrics.
- Two metrics with the same (aggregation, field) pair are duplicates and the tool call will be REJECTED at validation. Make sure the two metrics differ in either aggregation, field, or both.
- Order matters: put the metric you want emphasized (or with the larger scale) first, since it gets the left axis and the primary color.

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

  function renderMultiLine(output: MultiLineInput, id: string) {
    const { entityName, dimension, metrics, filters, joins } = output;
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
          MULTI_LINE_DIMENSION_TYPES,
        )
      : resolveSingleBinnedDimension(
          entity,
          dimension,
          MULTI_LINE_DIMENSION_TYPES,
        );

    if (!resolvedDimension) {
      return <NoDataMessage />;
    }

    const resolvedMetrics = metrics
      .map((metric) =>
        qualifiedFields
          ? resolveMultiBinnedMetric(entityName, metric, qualifiedFields)
          : resolveSingleBinnedMetric(entity, metric),
      )
      .filter((m): m is ResolvedMetric => m !== null);

    const uniqueMetrics = dedupeMetrics(resolvedMetrics);

    if (uniqueMetrics.length < 2) {
      return <NoDataMessage />;
    }

    const dataModel = buildMultiBinnedDataModel({
      id: entityName,
      dimension: resolvedDimension.id,
      dimensionType: resolvedDimension.type,
      metrics: uniqueMetrics,
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
      type: "multi_line" as const,
      dimensions: [resolvedDimension.id],
      metrics: dataModel.metrics.map((m) => m.id),
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
      <MultiLineChartCard
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={adapter}
      />
    );
  }

  return { toolPrompt, renderMultiLine };
}
