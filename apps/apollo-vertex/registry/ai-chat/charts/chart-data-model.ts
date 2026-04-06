export type ColumnType = "numeric" | "string" | "boolean" | "datetime";

export interface Column {
  name: string;
  type: ColumnType;
}

// ── Table builders ──────────────────────────────────────────────────────────

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

// ── Bar chart builders ──────────────────────────────────────────────────────

export function buildBarDataModel(
  columns: Column[],
  dimensions: string[],
  metrics: string[],
) {
  return {
    id: "inline-bar",
    dimensions: dimensions.map((d) => ({
      id: d,
      type: (columns.find((c) => c.name === d)?.type ?? "string") as ColumnType,
    })),
    metrics: metrics.map((m) => ({
      id: m,
      display: m,
      aggregation: "SUM" as const,
      field: m,
    })),
  };
}

export function buildBarConfiguration(
  dimensions: string[],
  metrics: string[],
  title?: string,
) {
  return {
    id: "inline-bar-config",
    name: title ?? "Bar Chart",
    type: "bar" as const,
    dimensions,
    metrics,
  };
}
