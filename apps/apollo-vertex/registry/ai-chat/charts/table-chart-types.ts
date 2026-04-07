import type { ConfigFilter } from "./chart-shared-types";

export interface TableChartConfig {
  id: string;
  name: string;
  type: "table";
  dimensions: string[];
  filters?: ConfigFilter[];
}
