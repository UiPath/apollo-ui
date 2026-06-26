import { z } from "zod";
import { BaseChartConfigurationSchema } from "./base-chart-configuration";

export const MultiLineChartConfigurationSchema =
  BaseChartConfigurationSchema.extend({
    type: z.literal("multi_line"),
    dimensions: z.array(z.string()),
    metrics: z.array(z.string()),
  });

export type MultiLineChartConfiguration = z.infer<
  typeof MultiLineChartConfigurationSchema
>;
