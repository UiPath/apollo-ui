"use client";

import { toolDefinition } from "@tanstack/ai";
import type { DataAdapter } from "@uipath/apollo-dashboarding";
import { Suspense } from "react";
import { z } from "zod";
import { NoDataMessage } from "../../charts/no-data-message";
import { buildStaticDataAdapter } from "../../charts/static-data-adapter";
import { TableChartCard } from "../../charts/table-chart-card";
import {
  buildTableConfiguration,
  buildTableDataModel,
} from "../../charts/table-data-model";
import type { AiChatTool } from "../tool-types";

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

type TableInput = z.infer<typeof tableInput>;

export const TABLE_TOOL_PROMPT = `You have a "show_table" tool.
When the user wants to see data as a table, call it with column definitions and row data.
Each row is an object keyed by column name. Keep column count reasonable (3-8).
After calling the tool, keep text reply short — the UI renders the table.`;

const showTableDef = toolDefinition({
  name: "show_table",
  description:
    "Display structured data as a table. Call this when the user wants to see data in tabular form. Provide column definitions with names and types, plus row data as objects keyed by column name.",
  inputSchema: tableInput,
});

export const showTableClient = showTableDef.client((input) => input);

interface CreateTableToolOptions {
  buildAdapter?: (
    rows: Record<string, unknown>[],
    cacheKey: string,
  ) => DataAdapter;
}

export function createTableTool(options?: CreateTableToolOptions): AiChatTool {
  const buildAdapter = options?.buildAdapter ?? buildStaticDataAdapter;

  return {
    tool: showTableClient,
    prompt: TABLE_TOOL_PROMPT,
    render: (args) => {
      const { columns, rows, title } = args as TableInput;
      if (!columns?.length || !rows) {
        return <NoDataMessage />;
      }
      const safeRows = rows ?? [];
      const dataModel = buildTableDataModel(columns);
      const configuration = buildTableConfiguration(columns, title);
      const cacheKey = JSON.stringify(safeRows).slice(0, 200);
      const adapter = buildAdapter(safeRows, cacheKey);
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
  };
}

export const tableTool = createTableTool();
