import type { Column, ColumnType } from "./chart-shared-types";

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
