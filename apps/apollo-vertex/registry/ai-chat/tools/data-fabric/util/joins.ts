import { z } from "zod";

export const joinSchema = z.object({
  type: z.enum(["INNER", "LEFT"]).describe("Join type"),
  entity: z.string().describe("Entity to join"),
  on: z.object({
    left: z
      .string()
      .describe("Field from the primary entity (EntityName.Field format)"),
    right: z
      .string()
      .describe("Field from the joined entity (EntityName.Field format)"),
  }),
});

export type JoinInput = z.infer<typeof joinSchema>;
