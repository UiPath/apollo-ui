import { z } from "zod";

export const PrimitiveValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.number().nullable(),
]);

const StackValuesDataSchema = z.array(
  z.union([PrimitiveValueSchema, z.object({ type: z.literal("rest") })]),
);

const DataQueryResponseEntrySchema = z.union([
  PrimitiveValueSchema,
  z.array(z.number().nullable()),
]);

const DataQueryResponseMetricSchema = z.object({
  stackValues: z.array(StackValuesDataSchema).nullable().default(null),
  ungrouped: z
    .union([z.number().nullable(), z.array(z.number().nullable())])
    .default(null),
  values: z.array(DataQueryResponseEntrySchema).nullable(),
});

export const DataQueryResponseSchema = z.record(
  z.string(),
  DataQueryResponseMetricSchema,
);

export type DataQueryResponse = z.infer<typeof DataQueryResponseSchema>;
