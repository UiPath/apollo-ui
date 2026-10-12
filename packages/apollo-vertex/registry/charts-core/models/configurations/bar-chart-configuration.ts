import { z } from "zod";
import { BaseChartConfigurationSchema } from "./base-chart-configuration";

export const BarChartConfigurationSchema = BaseChartConfigurationSchema.extend({
  type: z.literal("bar"),
  dimensions: z.array(z.string()),
  metrics: z.array(z.string()),
});
export type BarChartConfiguration = z.infer<typeof BarChartConfigurationSchema>;
