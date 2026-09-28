import { z } from "zod";
import { FilterFragmentSchema } from "./filter-fragment-schema";

const TableFragmentSchema = z.object({
  kind: z.literal("tableWith"),
  table: z.string(),
  invert: z.boolean().optional(),
  filters: z.array(FilterFragmentSchema),
});

const MainTableSchema = z.object({
  kind: z.literal("primarykey"),
  table: z.string(),
});

export const FilterRequestSchema = z.union([
  FilterFragmentSchema,
  TableFragmentSchema,
  MainTableSchema,
]);

export type FilterRequest = z.infer<typeof FilterRequestSchema>;
