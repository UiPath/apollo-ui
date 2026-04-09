"use client";

import { toolDefinition } from "@tanstack/ai";
import { Suspense } from "react";
import { z } from "zod";
import { NoDataMessage } from "../../charts/no-data-message";
import { buildStaticDataAdapter } from "../../charts/static-data-adapter";
import { TableChartCard } from "../../charts/table-chart-card";
import {
  buildTableConfiguration,
  buildTableDataModel,
} from "../../charts/table-data-model";

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

export const DATA_FABRIC_TABLE_PROMPT = `You have a "data_fabric_table" tool.
When the user wants to see data as a table, call it with column definitions and row data.
Each row is an object keyed by column name. Keep column count reasonable (3-8).
After calling the tool, keep text reply short — the UI renders the table.`;

const dataFabricTableDef = toolDefinition({
  name: "data_fabric_table",
  description:
    "Display structured data as a table. Call this when the user wants to see data in tabular form. Provide column definitions with names and types, plus row data as objects keyed by column name.",
  inputSchema: tableInput,
});

export const dataFabricTableClient = dataFabricTableDef.client(
  (input) => input,
);

export function renderDataFabricTable(output: unknown) {
  const { columns, rows, title } = output as TableInput;
  if (!columns?.length || !rows) {
    return <NoDataMessage />;
  }
  const dataModel = buildTableDataModel(columns);
  const configuration = buildTableConfiguration(columns, title);
  const cacheKey = `${rows.length}:${columns.map((c) => c.name).join(",")}`;
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
}
