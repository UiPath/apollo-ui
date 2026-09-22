import { z } from "zod";

const SortStateSchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"]),
});

const NullableSortStateSchema = SortStateSchema.nullable();

export const TableChartStateSchema = z.object({
  sortBy: NullableSortStateSchema,
});

export type TableChartState = z.infer<typeof TableChartStateSchema>;
