import { z } from "zod";

const PrimitiveValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.number(),
  z.null(),
]);

const ListFilterFragmentSchema = z.object({
  dimension: z.string(),
  values: z.array(PrimitiveValueSchema),
  type: z.union([
    z.literal("string"),
    z.literal("boolean"),
    z.literal("numeric"),
  ]),
  kind: z.literal("values"),
  invert: z.boolean(),
});
export type ListFilterFragment = z.infer<typeof ListFilterFragmentSchema>;

const SearchFilterFragmentSchema = z.object({
  dimension: z.string(),
  pattern: z.string(),
  filterType: z.union([
    z.literal("default"),
    z.literal("startsWith"),
    z.literal("endsWith"),
  ]),
  type: z.literal("string"),
  kind: z.literal("search"),
  invert: z.boolean().optional(),
});
export type SearchFilterFragment = z.infer<typeof SearchFilterFragmentSchema>;

const PeriodFilterFragmentSchema = z.object({
  dimension: z.string(),
  type: z.literal("datetime"),
  range: z.object({
    inclusive: z.boolean(),
    start: z.string(),
    end: z.string(),
  }),
  kind: z.literal("range"),
});
export type PeriodFilterFragment = z.infer<typeof PeriodFilterFragmentSchema>;

const RangeFilterFragmentSchema = z.object({
  dimension: z.string(),
  type: z.literal("numeric"),
  range: z.object({
    inclusive: z.boolean(),
    start: z.number().optional(),
    end: z.number().optional(),
  }),
  kind: z.literal("range"),
});
export type RangeFilterFragment = z.infer<typeof RangeFilterFragmentSchema>;

export const FilterFragmentSchema = z.union([
  ListFilterFragmentSchema,
  PeriodFilterFragmentSchema,
  RangeFilterFragmentSchema,
  SearchFilterFragmentSchema,
]);
export type FilterFragment = z.infer<typeof FilterFragmentSchema>;
