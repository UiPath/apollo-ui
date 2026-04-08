"use client";

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

export const columnSchema = z.object({
  name: z.string().describe("Column name"),
  type: z
    .enum(["string", "numeric", "boolean", "datetime"])
    .default("string")
    .describe("Data type"),
});

export const tableInput = z.object({
  title: z.string().optional().describe("Table title"),
  columns: z.array(columnSchema).min(1).describe("Column definitions"),
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .describe("Data rows as objects keyed by column name"),
});

export type TableInput = z.infer<typeof tableInput>;

export interface TableToolRenderOptions {
  buildAdapter?: (
    rows: Record<string, unknown>[],
    cacheKey: string,
  ) => DataAdapter;
}

export function renderTable(output: unknown, options?: TableToolRenderOptions) {
  const buildAdapter = options?.buildAdapter ?? buildStaticDataAdapter;
  const { columns, rows, title } = output as TableInput;
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
}
