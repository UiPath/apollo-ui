import { z } from "zod";
import { BaseChartConfigurationSchema } from "./base-chart-configuration";

export const LineChartConfigurationSchema = BaseChartConfigurationSchema.extend(
  {
    type: z.literal("line"),
    dimensions: z.array(z.string()),
    metrics: z.array(z.string()),
  },
);

export type LineChartConfiguration = z.infer<
  typeof LineChartConfigurationSchema
>;
