import { z } from "zod";

export const ChartTypeSchema = z.enum([
  "line",
  "multi_line",
  "bar",
  "table",
  "distribution",
  "kpi",
]);
