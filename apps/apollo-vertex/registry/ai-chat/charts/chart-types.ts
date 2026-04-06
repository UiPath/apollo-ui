import type { BarChartConfiguration } from "@uipath/apollo-dashboarding";

export type ConfigFilter = NonNullable<BarChartConfiguration["filters"]>[number];

export interface TableChartConfig {
  id: string;
  name: string;
  type: "table";
  dimensions: string[];
  filters?: ConfigFilter[];
}

export interface BarChartConfig {
  id: string;
  name: string;
  type: "bar";
  dimensions: string[];
  metrics: string[];
  filters?: ConfigFilter[];
}
