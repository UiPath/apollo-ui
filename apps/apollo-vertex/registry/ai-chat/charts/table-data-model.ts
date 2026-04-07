import type { Column } from "./chart-shared-types";

export function buildTableDataModel(columns: Column[]) {
  return {
    id: "inline-table",
    fields: columns.map((c) => ({
      id: c.name,
      display: c.name,
      type: c.type,
    })),
  };
}

export function buildTableConfiguration(columns: Column[], title?: string) {
  return {
    id: "inline-table-config",
    name: title ?? "Data Table",
    type: "table" as const,
    dimensions: columns.map((c) => c.name),
  };
}
