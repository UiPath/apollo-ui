"use client";

import { toolDefinition } from "@tanstack/ai";
import { standaloneAdapter } from "@uipath/apollo-dashboarding";
import { DateTime } from "luxon";
import { z } from "zod";
import { TableChartCard } from "../../charts/table-chart-card";
import { ToolResolutionError } from "../../charts/tool-resolution-error";
import { filterSchema, resolveFilters } from "../data-fabric/shared";
import {
  buildInsightsTableDataModel,
  collectInsightsFieldIds,
  collectInsightsTableIds,
  generateInsightsSchemaDocs,
  type InsightsToolContext,
} from "../insights/shared";

const insightsTableInput = z.object({
  dimensions: z
    .array(z.string())
    .min(1)
    .describe(
      "Qualified field IDs (Table.Field) to display as table columns. Use IDs exactly as listed in the Schema Reference.",
    ),
  filters: z
    .array(filterSchema)
    .optional()
    .describe("Optional filters to narrow down results."),
});

const insightsTableDef = toolDefinition({
  name: "insights_table",
  description:
    "List records from the Insights tables (PROCESSRUNS, ELEMENTRUNS, INCIDENTS) for the vertical-solution source. Use this tool whenever the user's request mentions process runs, element runs, incidents, or the table names PROCESSRUNS / ELEMENTRUNS / INCIDENTS — regardless of how the user phrases the verb. 'List', 'show', 'how many', 'distribution of', 'over time', 'trend of', 'by status' all map to THIS tool when the underlying data is Insights. The data source decides, not the verb. Field names must be qualified Table.Field IDs copied EXACTLY from the schema (e.g. PROCESSRUNS.STATUS, ELEMENTRUNS.ELEMENTNAME). Supports optional filters (list, search, range including datetime).",
  inputSchema: insightsTableInput,
  outputSchema: insightsTableInput,
  metadata: { skipFollowUp: true },
});

export const insightsTableClient = insightsTableDef.client((input) => input);

type InsightsTableInput = z.infer<typeof insightsTableInput>;

export function createInsightsTableTool(context: InsightsToolContext) {
  const today = DateTime.now().toISODate();
  const fieldIds = collectInsightsFieldIds(context.schema);
  const tableIds = collectInsightsTableIds(context.schema);
  const dataModel = buildInsightsTableDataModel(
    context.sourceType,
    context.schema,
  );

  const toolPrompt = `You have an "insights_table" tool. It is the ONLY tool that operates on the Insights "${context.sourceType}" source.

PRECONDITION — call this tool whenever the user's request references identifiers from the Schema Reference below (the tables ${tableIds.join(", ")}, any Table.Field under them, or any natural-language phrasing of those table names). Use it regardless of the action verb — "list", "show", "how many", "distribution of", "over time", "trend of", "by status" all map to this tool when the data is Insights. Other registered chart tools operate on a different source and must NOT be called for these tables.

## Schema Reference (source: ${context.sourceType})
${generateInsightsSchemaDocs(context.schema)}

## How to call
- Pass field IDs the user wants as columns in "dimensions". Field IDs are qualified "Table.Field" — use them EXACTLY as listed in the Schema Reference (case-sensitive, including the table prefix). Unqualified or paraphrased names are rejected.
- If the user does not specify fields, pick a reasonable default set (3-8 fields) from the Schema Reference.

## Filters
You can optionally pass filters to narrow results. Filter "field" must also be a qualified "Table.Field" ID from the Schema Reference. Available filter types:
- **list**: match specific values. Use valueType matching the field type (string/number/boolean). Set invert=true to exclude.
- **search**: text pattern matching on string fields. searchFilterType: "default" (contains), "startsWith", "endsWith".
- **range** (numeric): use valueType="number" with min/max numbers.
- **range** (datetime): use valueType="datetime" with min/max as ISO 8601 strings (e.g. "2026-01-01" or "2026-01-01T00:00:00Z"). Today is ${today} — use it to resolve relative phrases like "last 30 days" or "this year" into absolute ISO dates before passing them.
Only add filters when the user asks to filter, search, or narrow results.`;

  function renderTable(output: InsightsTableInput, id: string) {
    const { dimensions, filters } = output;

    const validFieldIds = new Set(fieldIds);
    const validDimensions = dimensions.filter((d) => validFieldIds.has(d));

    if (validDimensions.length === 0) {
      return (
        <ToolResolutionError
          failure={{
            reason: "insights_table_no_valid_fields",
            source: context.sourceType,
            fields: dimensions.join(", "),
          }}
        />
      );
    }

    const normalizedFilters = resolveFilters(filters, {
      mode: "single",
      validFields: fieldIds,
    });

    const configuration = {
      id,
      name: context.sourceType,
      type: "table" as const,
      dimensions: validDimensions,
      filters: normalizedFilters,
    };

    const adapter = standaloneAdapter({
      baseUrl: context.insightsBaseUrl,
      accessToken: context.accessToken,
      sourceType: context.sourceType,
    });

    return (
      <TableChartCard
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={adapter}
      />
    );
  }

  return { toolPrompt, renderTable };
}
