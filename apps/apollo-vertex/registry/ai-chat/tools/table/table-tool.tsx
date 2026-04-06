"use client";

import { Suspense } from "react";
import { z } from "zod";
import { createDisplayTool } from "../tool-utils";
import { TableChartCard } from "../../charts/chart-card";
import {
  buildTableDataModel,
  buildTableConfiguration,
} from "../../charts/chart-data-model";
import { buildStaticDataAdapter } from "../../charts/static-data-adapter";

const columnSchema = z.object({
  name: z.string().describe("Column name"),
  type: z
    .enum(["string", "numeric", "boolean", "datetime"])
    .default("string")
    .describe("Data type"),
});

const tableInput = z.object({
  title: z.string().optional().describe("Table title"),
  columns: z.array(columnSchema).min(1).describe("Column definitions"),
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .describe("Data rows as objects keyed by column name"),
});

export const TABLE_TOOL_PROMPT = `You have a "show_table" tool.
When the user wants to see data as a table, call it with column definitions and row data.
Each row is an object keyed by column name. Keep column count reasonable (3-8).
After calling the tool, keep text reply short — the UI renders the table.`;

export const tableTool = createDisplayTool({
  name: "show_table",
  description:
    "Display structured data as a table. Call this when the user wants to see data in tabular form. Provide column definitions with names and types, plus row data as objects keyed by column name.",
  inputSchema: tableInput,
  prompt: TABLE_TOOL_PROMPT,
  render: (args) => {
    if (!args.columns?.length || !args.rows) {
      return (
        <p className="text-sm text-muted-foreground">
          No data to display.
        </p>
      );
    }
    const rows = args.rows ?? [];
    const dataModel = buildTableDataModel(args.columns);
    const configuration = buildTableConfiguration(args.columns, args.title);
    const cacheKey = JSON.stringify(rows).slice(0, 200);
    const adapter = buildStaticDataAdapter(rows, cacheKey);
    return (
      <Suspense>
        <TableChartCard
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={adapter}
        />
      </Suspense>
    );
  },
});
