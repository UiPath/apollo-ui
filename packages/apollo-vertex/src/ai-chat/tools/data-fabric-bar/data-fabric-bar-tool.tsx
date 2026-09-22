"use client";

import { toolDefinition } from "@tanstack/ai";
import { DateTime } from "luxon";
import { z } from "zod";
import { assert } from "@/lib/asserts/assert";
import { dataFabricAdapter } from "@/lib/data-fabric-adapter";
import { BarChartCard } from "../../charts/bar-chart-card";
import { ToolResolutionError } from "../../charts/tool-resolution-error";
import {
  buildMultiMetricDataModel,
  dedupeMetrics,
  type MetricInput,
  metricSchema,
  type ResolvedMetric,
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
import type { ResolverFailure } from "../data-fabric/util/resolver-result";

const BAR_DIMENSION_TYPES = ["string"] as const;

const dataFabricBarInput = z.object({
  entityName: z.string().describe("Data Fabric entity name to query"),
  dimension: z
    .string()
    .describe(
      "Categorical (string) field name to break the metrics down by — one bar (or grouped cluster, with multiple metrics) per distinct value. When joining, use EntityName.Field format.",
    ),
  metrics: z
    .array(metricSchema)
    .min(1)
    .refine(
      (metrics) => {
        const keys = new Set(
          metrics.map((m) => `${m.aggregation}|${m.field ?? ""}`),
        );
        return keys.size === metrics.length;
      },
      {
        message:
          "Metrics must have distinct (aggregation, field) pairs — pick distinct metrics.",
      },
    )
    .optional()
    .describe(
      "One or more metrics to plot. With one metric, each category gets one bar. With multiple metrics, each category gets a grouped cluster (one bar per metric). Omit entirely for the default single COUNT of records per category.",
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

const dataFabricBarDef = toolDefinition({
  name: "data_fabric_bar",
  description:
    "Render a bar chart from a Data Fabric entity, breaking one or more metrics down by a categorical (string) dimension. With multiple metrics, renders grouped bars (one cluster per category). Supports optional metrics (default single COUNT), filters, and joins.",
  inputSchema: dataFabricBarInput,
  outputSchema: dataFabricBarInput,
  metadata: { skipFollowUp: true },
});

export const dataFabricBarClient = dataFabricBarDef.client((input) => input);

type BarInput = z.infer<typeof dataFabricBarInput>;

export function createDataFabricBarTool(context: DataFabricToolContext) {
  const today = DateTime.now().toISODate();
  const toolPrompt = `You have a "data_fabric_bar" tool.
Use it to render a bar chart that breaks one or more metrics down by a categorical (string) dimension. With one metric, each category gets one bar. With multiple metrics, each category gets a grouped cluster (one bar per metric).

## Dimension
- Pass exactly one "dimension" — a field name. It MUST be a string field on the chosen entity (see Entity Reference). Bar charts are for discrete categories; numeric/datetime fields belong on a distribution or line chart instead.
- When the user explicitly names a field (e.g. "<metric> by EntityName.Field" or "breakdown by <field>"), use EXACTLY that field as the dimension. Do not substitute a different field — even when joins are involved.
- If the user-named field is not a string field, do NOT call this tool. For numeric or datetime fields use "data_fabric_distribution" (histogram) or "data_fabric_line" (time series) respectively, and reply explaining the substitution.
- Joins exist mainly to FILTER by a joined entity's attribute or to break down by a categorical field that lives on a joined entity.

## Metrics
- Omit "metrics" entirely for the default single COUNT of records per category.
- Pass an array of one or more metrics for grouped bars. Each metric becomes one bar within each category cluster. There is **no upper limit** — three, four, or more metrics all render as additional bars in the same cluster. Do NOT push back on the user or ask them to pick fewer; pass every metric they named.
  - For COUNT, pass { aggregation: "COUNT" } — "field" is optional and defaults to the entity primary key.
  - For SUM/AVG/MIN/MAX, pass { aggregation, field } where "field" is a numeric field on the chosen entity.
- Use a single metric for "<metric> by <category>" requests. Use multiple metrics whenever the user asks to compare values per category (e.g. "compare orders count, total revenue, and average revenue by status").
- Metrics with the same (aggregation, field) pair are duplicates and the tool call will be REJECTED at validation. Make sure each metric differs in aggregation, field, or both.

## Filters
You can optionally pass filters to narrow results. Available filter types:
- **list**: match specific values. Use valueType matching the field type (string/number/boolean). Set invert=true to exclude.
- **search**: text pattern matching on string fields. searchFilterType: "default" (contains), "startsWith", "endsWith".
- **range** (numeric): use valueType="number" with min/max numbers.
- **range** (datetime): use valueType="datetime" with min/max as ISO 8601 strings (e.g. "2026-01-01" or "2026-01-01T00:00:00Z"). Today is ${today} — use it to resolve relative phrases like "last 30 days" or "this year" into absolute ISO dates before passing them.
Only add filters when the user asks to filter, search, or narrow results.

## Multi-Entity Joins
To break down by a categorical field that lives on a joined entity, or to aggregate a numeric field from a joined entity, add "joins" to link related entities. The entityName field is the primary entity.
When using joins, use qualified field names everywhere: "EntityName.FieldName" (using the EXACT entity names from the Entity Reference, never abbreviations or aliases).
Only use joins when the user explicitly asks to combine data from multiple entities.

## Entity Reference
${generateEntityFieldsDocs(context.entities)}`;

  function renderBar(output: BarInput, id: string) {
    const { entityName, dimension, metrics, filters, joins } = output;
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
          BAR_DIMENSION_TYPES,
        )
      : resolveSingleDimension(entity, dimension, BAR_DIMENSION_TYPES);

    if (!resolvedDimension.ok) {
      return <ToolResolutionError failure={resolvedDimension} />;
    }

    const resolveOne = (input?: MetricInput) =>
      qualifiedFields
        ? resolveMultiMetric(entityName, input, qualifiedFields)
        : resolveSingleMetric(entity, input);

    const resolutions = metrics?.length
      ? metrics.map((m) => resolveOne(m))
      : [resolveOne()];

    const resolvedMetrics: ResolvedMetric[] = [];
    const metricFailures: ResolverFailure[] = [];
    for (const result of resolutions) {
      if (result.ok) {
        resolvedMetrics.push(result.value);
      } else {
        const { ok: _ok, ...failure } = result;
        metricFailures.push(failure);
      }
    }

    const uniqueMetrics = dedupeMetrics(resolvedMetrics);

    if (uniqueMetrics.length === 0) {
      const firstFailure = metricFailures[0];
      assert(
        firstFailure != null,
        "bar tool: empty resolved metrics but no recorded failures",
      );
      return <ToolResolutionError failure={firstFailure} />;
    }

    const dataModel = buildMultiMetricDataModel({
      id: entityName,
      dimension: resolvedDimension.value.id,
      dimensionType: resolvedDimension.value.type,
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
      type: "bar" as const,
      dimensions: [resolvedDimension.value.id],
      metrics: dataModel.metrics.map((m) => m.id),
      filters: normalizedFilters,
      ...(isMultiEntity &&
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
      <BarChartCard
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={adapter}
      />
    );
  }

  return { toolPrompt, renderBar };
}
