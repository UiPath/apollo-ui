import type { ConfigFilter } from "./chart-shared-types";

export interface BarChartConfig {
  id: string;
  name: string;
  type: "bar";
  dimensions: string[];
  metrics: string[];
  filters?: ConfigFilter[];
}
