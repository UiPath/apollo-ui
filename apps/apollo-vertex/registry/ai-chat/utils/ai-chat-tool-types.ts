import type { ReactNode } from "react";
import { type ZodType, z } from "zod";

export type MaybePromise<T> = T | Promise<T>;

interface BaseTool<TInputSchema extends ZodType = ZodType> {
  description: string;
  inputSchema: TInputSchema;
}

export interface ExecuteTool<
  TInputSchema extends ZodType = ZodType,
  TOutputSchema extends ZodType = ZodType,
> extends BaseTool<TInputSchema> {
  outputSchema?: TOutputSchema;
  execute(args: z.infer<TInputSchema>): MaybePromise<z.infer<TOutputSchema>>;
}

export interface DisplayTool<TInputSchema extends ZodType = ZodType>
  extends BaseTool<TInputSchema> {
  render(args: z.infer<TInputSchema>): ReactNode;
}

export type Tool<
  TInputSchema extends ZodType = ZodType,
  TOutputSchema extends ZodType = ZodType,
> = ExecuteTool<TInputSchema, TOutputSchema> | DisplayTool<TInputSchema>;

export type Tools = Record<string, Tool>;

const choiceOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string().optional(),
  recommended: z.boolean().optional(),
});

export const toolResultChoicesSchema = z.object({
  type: z.literal("choices"),
  prompt: z.string(),
  options: z.array(choiceOptionSchema),
});

export type ChoiceOption = z.infer<typeof choiceOptionSchema>;
export type ToolResultChoices = z.infer<typeof toolResultChoicesSchema>;
export type ToolResult = ToolResultChoices;
