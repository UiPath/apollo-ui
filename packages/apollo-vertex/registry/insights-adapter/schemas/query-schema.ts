import { z } from "zod";
import { AggregateFragmentSchema } from "./aggregate-fragment-schema";
import { FilterRequestSchema } from "./filter-request-schema";

export const InsightsQueryRequestSchema = z.object({
  filters: z.array(z.array(FilterRequestSchema)),
  groupBy: z.array(z.string()),
  aggregates: z.array(AggregateFragmentSchema),
  sort: z
    .array(
      z.object({
        field: z.string(),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .optional(),
  binning: z
    .object({
      bins: z.array(z.union([z.string(), z.number()])),
      dimension: z.string(),
      extraBins: z.enum(["none", "null"]),
    })
    .optional(),
  stacks: z
    .object({
      field: z.string(),
      orderByMetric: z.string(),
      maxCount: z.number(),
    })
    .optional(),
});

export type InsightsQueryRequest = z.infer<typeof InsightsQueryRequestSchema>;
