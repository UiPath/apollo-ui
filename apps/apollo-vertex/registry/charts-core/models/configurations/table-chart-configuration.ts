import { z } from "zod";
import { BaseChartConfigurationSchema } from "./base-chart-configuration";

export const TableChartConfigurationSchema =
  BaseChartConfigurationSchema.extend({
    type: z.literal("table"),
    dimensions: z.array(z.string()),
  });

export type TableChartConfiguration = z.infer<
  typeof TableChartConfigurationSchema
>;
