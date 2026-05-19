import { z } from "zod";
import { BaseChartConfigurationSchema } from "./base-chart-configuration";

export const DistributionChartConfigurationSchema =
  BaseChartConfigurationSchema.extend({
    type: z.literal("distribution"),
    dimensions: z.array(z.string()),
    metrics: z.array(z.string()),
  });

export type DistributionChartConfiguration = z.infer<
  typeof DistributionChartConfigurationSchema
>;
