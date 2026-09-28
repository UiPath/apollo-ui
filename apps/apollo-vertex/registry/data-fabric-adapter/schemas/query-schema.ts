import { z } from "zod";
import {
  FromConfigSchema,
  JoinConfigSchema,
  PrimitiveValueSchema,
} from "@/lib/charts-core";

const DataFabricSortOptionSchema = z.object({
  fieldName: z.string(),
  isDescending: z.boolean(),
});

export const DataFabricQueryFilterSchema = z.object({
  fieldName: z.string(),
  operator: z.enum([
    "=",
    "!=",
    ">",
    "<",
    ">=",
    "<=",
    "in",
    "not in",
    "contains",
    "not contains",
    "startswith",
    "endswith",
  ]),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ]),
});

const DataFabricFilterGroupSchema = z.object({
  logicalOperator: z.enum(["and", "or"]),
  queryFilters: z.array(DataFabricQueryFilterSchema),
});

const DataFabricAggregateRequestSchema = z.object({
  function: z.enum(["COUNT", "SUM", "AVG", "MIN", "MAX"]),
  field: z.string(),
  alias: z.string().optional(),
});

const DataFabricBinningRequestSchema = z.discriminatedUnion("type", [
  z.object({
    fieldName: z.string(),
    type: z.literal("Numeric"),
    numericBinSize: z.number().positive(),
  }),
  z.object({
    fieldName: z.string(),
    type: z.literal("Date"),
    dateBinUnit: z.enum(["Year", "Quarter", "Month", "Week", "Day", "Hour"]),
  }),
]);

export const DataFabricQueryRequestSchema = z.object({
  selectedFields: z.array(z.string()).optional(),
  top: z.number().optional(),
  skip: z.number().optional(),
  sortOptions: z.array(DataFabricSortOptionSchema).optional(),
  filterGroup: DataFabricFilterGroupSchema.optional(),
  aggregates: z.array(DataFabricAggregateRequestSchema).optional(),
  groupBy: z.array(z.string()).optional(),
  joins: z.array(JoinConfigSchema).optional(),
  from: FromConfigSchema.optional(),
  binnings: z.array(DataFabricBinningRequestSchema).optional(),
});

export const DataFabricQueryResponseSchema = z.object({
  totalRecordCount: z.number(),
  value: z.array(z.record(z.string(), PrimitiveValueSchema)),
});

export type DataFabricQueryRequest = z.infer<
  typeof DataFabricQueryRequestSchema
>;
export type DataFabricQueryResponse = z.infer<
  typeof DataFabricQueryResponseSchema
>;
export type DataFabricBinningRequest = z.infer<
  typeof DataFabricBinningRequestSchema
>;
