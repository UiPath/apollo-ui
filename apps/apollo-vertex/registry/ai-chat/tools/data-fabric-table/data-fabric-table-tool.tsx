"use client";

import { toolDefinition } from "@tanstack/ai";
import { tableInput, renderTable, type TableToolRenderOptions } from "../table";

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

export function renderDataFabricTable(
  output: unknown,
  options?: TableToolRenderOptions,
) {
  return renderTable(output, options);
}
