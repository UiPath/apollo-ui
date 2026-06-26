import { z } from "zod";

export const JoinConfigSchema = z.object({
  type: z.enum(["INNER", "LEFT"]),
  entity: z.string(),
  alias: z.string().optional(),
  on: z.object({
    left: z.string(),
    right: z.string(),
  }),
});

export const FromConfigSchema = z.object({
  entity: z.string(),
  alias: z.string(),
});

export interface JoinConfig {
  type: "INNER" | "LEFT";
  entity: string;
  alias?: string;
  on: {
    left: string;
    right: string;
  };
}

export interface FromConfig {
  entity: string;
  alias: string;
}
