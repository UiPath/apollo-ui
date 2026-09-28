import { z } from "zod";
import { BaseChartConfigurationSchema } from "./base-chart-configuration";

export const KpiChartConfigurationSchema = BaseChartConfigurationSchema.extend({
  type: z.literal("kpi"),
  metrics: z.array(z.string()),
});

export type KpiChartConfiguration = z.infer<typeof KpiChartConfigurationSchema>;
