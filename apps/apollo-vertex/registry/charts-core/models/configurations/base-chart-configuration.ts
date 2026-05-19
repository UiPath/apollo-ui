import { z } from "zod";
import { FromConfigSchema, JoinConfigSchema } from "../join-schema";
import { ChartTypeSchema } from "./chart-type-schema";
import { FilterValuesSchema } from "./filter-values-schema";

export const BaseChartConfigurationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ChartTypeSchema,
  filters: z.array(FilterValuesSchema).optional(),
  joins: z.array(JoinConfigSchema).optional(),
  from: FromConfigSchema.optional(),
});
