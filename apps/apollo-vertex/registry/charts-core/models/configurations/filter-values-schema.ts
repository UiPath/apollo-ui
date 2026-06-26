import { DateTime } from "luxon";
import { z } from "zod";

const FilterTypeSchema = z.enum(["range", "list", "search"]);

const BaseFilterSchema = z.object({
  type: FilterTypeSchema,
});

const DateRangeFilterValuesSchema = BaseFilterSchema.extend({
  valueType: z.literal("datetime"),
  type: z.literal("range"),
  field: z.string(),
  range: z.object({
    min: z.custom<DateTime>((val) => val instanceof DateTime),
    max: z.custom<DateTime>((val) => val instanceof DateTime),
    inclusive: z.boolean().optional(),
  }),
});

const StringListFilterValuesSchema = BaseFilterSchema.extend({
  valueType: z.literal("string"),
  type: z.literal("list"),
  values: z.array(z.union([z.string(), z.null()])),
  field: z.string(),
  invert: z.boolean().optional(),
});

const BooleanListFilterValuesSchema = BaseFilterSchema.extend({
  valueType: z.literal("boolean"),
  type: z.literal("list"),
  values: z.array(z.union([z.boolean(), z.null()])),
  field: z.string(),
  invert: z.boolean().optional(),
});

const NumberListFilterValuesSchema = BaseFilterSchema.extend({
  valueType: z.literal("number"),
  type: z.literal("list"),
  values: z.array(z.union([z.number(), z.null()])),
  field: z.string(),
  invert: z.boolean().optional(),
});

const ListFilterValuesSchema = z.union([
  StringListFilterValuesSchema,
  BooleanListFilterValuesSchema,
  NumberListFilterValuesSchema,
]);

const NumberRangeFilterValuesSchema = BaseFilterSchema.extend({
  valueType: z.literal("number"),
  type: z.literal("range"),
  field: z.string(),
  range: z.union([
    z.object({
      min: z.number(),
      max: z.number().optional(),
      inclusive: z.boolean().optional(),
    }),
    z.object({
      min: z.number().optional(),
      max: z.number(),
      inclusive: z.boolean().optional(),
    }),
  ]),
});

const StringSearchFilterValuesSchema = BaseFilterSchema.extend({
  valueType: z.literal("string"),
  type: z.literal("search"),
  field: z.string(),
  pattern: z.string(),
  searchFilterType: z.enum(["default", "startsWith", "endsWith"]),
});

export const FilterValuesSchema = z.union([
  DateRangeFilterValuesSchema,
  NumberRangeFilterValuesSchema,
  StringSearchFilterValuesSchema,
  ListFilterValuesSchema,
]);
