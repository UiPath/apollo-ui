"use client";

import type { QueryClient } from "@tanstack/react-query";

type TableRow = Record<string, unknown>;

function escapeCell(value: unknown): string {
  if (value == null) return "";
  let str: string;
  if (typeof value === "string") str = value;
  else if (typeof value === "number" || typeof value === "boolean")
    str = String(value);
  else str = JSON.stringify(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function buildCsv(columns: string[], rows: TableRow[]): string {
  const header = columns.map((col) => escapeCell(col)).join(",");
  const body = rows.map((row) =>
    columns.map((col) => escapeCell(row[col])).join(","),
  );
  return [header, ...body].join("\n");
}

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTableToCsv(
  queryClient: QueryClient,
  entityName: string,
  dimensions: string[],
  filename: string,
): boolean {
  const queries = queryClient.getQueriesData<TableRow[]>({
    queryKey: [entityName, "query"],
  });
  const data = queries[0]?.[1] ?? null;

  if (!data || data.length === 0) {
    return false;
  }

  const columns =
    dimensions.length > 0 ? dimensions : Object.keys(data[0] ?? {});
  const csv = buildCsv(columns, data);
  triggerDownload(csv, filename);
  return true;
}
