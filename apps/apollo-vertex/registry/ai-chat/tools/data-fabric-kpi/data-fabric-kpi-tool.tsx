"use client";

import { toolDefinition } from "@tanstack/ai";
import { dataFabricAdapter } from "@uipath/apollo-dashboarding";
import { DateTime } from "luxon";
import { z } from "zod";
import { KpiChartCard } from "../../charts/kpi-chart-card";
import { ToolResolutionError } from "../../charts/tool-resolution-error";
import {
  buildMetricEntry,
  metricSchema,
  resolveMultiMetric,
  resolveSingleMetric,
} from "../data-fabric/util/chart-helpers";
import {
  collectQualifiedFields,
  type DataFabricToolContext,
  generateEntityFieldsDocs,
} from "../data-fabric/util/entities";
import { filterSchema, resolveFilters } from "../data-fabric/util/filters";
import { joinSchema } from "../data-fabric/util/joins";

const dataFabricKpiInput = z.object({
  entityName: z.string().describe("Data Fabric entity name to query"),
  metric: metricSchema.optional(),
  filters: z
    .array(filterSchema)
    .optional()
    .describe("Optional filters to narrow down results."),
  joins: z
    .array(joinSchema)
    .optional()
    .describe(
      "Join other entities. Use EntityName.Field format for the metric field when joining.",
    ),
});

const dataFabricKpiDef = toolDefinition({
  name: "data_fabric_kpi",
  description:
    "Render a single KPI value (a scalar metric) from a Data Fabric entity. Use for 'how many', 'total', 'average', 'max', 'min' style questions that boil down to one number. Supports optional metric (default COUNT), filters, and joins.",
  inputSchema: dataFabricKpiInput,
  outputSchema: dataFabricKpiInput,
  metadata: { skipFollowUp: true },
});

export const dataFabricKpiClient = dataFabricKpiDef.client((input) => input);

type KpiInput = z.infer<typeof dataFabricKpiInput>;

export function createDataFabricKpiTool(context: DataFabricToolContext) {
  const today = DateTime.now().toISODate();
  const toolPrompt = `You have a "data_fabric_kpi" tool.
Use it to render a SINGLE scalar value — one aggregated metric over an entity, with NO dimension/binning.

## When to use KPI vs other chart tools
- Use "data_fabric_kpi" for single-number questions: "how many orders are open", "total revenue", "average invoice amount", "max order total", "count of active customers".
- Use "data_fabric_line" / "data_fabric_distribution" when the user wants the value broken down across a time or value axis ("over time", "by month", "distribution of").
- Use "data_fabric_table" when the user wants individual records.
- KPI never has a dimension — if the user asks to slice the value across a field, do NOT call this tool.

## Metric
- Omit "metric" entirely for the default COUNT of records.
- For SUM/AVG/MIN/MAX, pass { aggregation, field } where "field" is a numeric field on the chosen entity.
- Pick SUM/AVG/MIN/MAX only when the user explicitly asks to aggregate a numeric field (e.g. "total order value" → SUM of OrderTotal). Otherwise default to COUNT.

## Filters
You can optionally pass filters to narrow results. Available filter types:
- **list**: match specific values. Use valueType matching the field type (string/number/boolean). Set invert=true to exclude.
- **search**: text pattern matching on string fields. searchFilterType: "default" (contains), "startsWith", "endsWith".
- **range** (numeric): use valueType="number" with min/max numbers.
- **range** (datetime): use valueType="datetime" with min/max as ISO 8601 strings (e.g. "2026-01-01" or "2026-01-01T00:00:00Z"). Today is ${today} — use it to resolve relative phrases like "last 30 days" or "this year" into absolute ISO dates before passing them.
Only add filters when the user asks to filter, search, or narrow results.

## Multi-Entity Joins
To aggregate a numeric field that lives on a joined entity, add "joins" to link related entities. The entityName field is the primary entity.
When using joins, use qualified field names everywhere: "EntityName.FieldName" (using the EXACT entity names from the Entity Reference, never abbreviations or aliases).
Only use joins when the user explicitly asks to combine data from multiple entities.

## Entity Reference
${generateEntityFieldsDocs(context.entities)}`;

  function renderKpi(output: KpiInput, id: string) {
    const { entityName, metric, filters, joins } = output;
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

    const resolvedMetric = qualifiedFields
      ? resolveMultiMetric(entityName, metric, qualifiedFields)
      : resolveSingleMetric(entity, metric);

    if (!resolvedMetric.ok) {
      return <ToolResolutionError failure={resolvedMetric} />;
    }

    const metricEntry = buildMetricEntry(resolvedMetric.value);

    const dataModel = {
      id: entityName,
      metrics: [metricEntry],
    };

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
      type: "kpi" as const,
      metrics: [metricEntry.id],
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
      <KpiChartCard
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={adapter}
      />
    );
  }

  return { toolPrompt, renderKpi };
}
