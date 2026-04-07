import type { BarChartConfiguration } from "@uipath/apollo-dashboarding";

export type ColumnType = "numeric" | "string" | "boolean" | "datetime";

export interface Column {
  name: string;
  type: ColumnType;
}

export type ConfigFilter = NonNullable<
  BarChartConfiguration["filters"]
>[number];
