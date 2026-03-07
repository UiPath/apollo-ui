import type { ReactNode } from "react";
import { type ZodType, z } from "zod";
import type { ToolCallPart } from "./ai-chat-message-types";

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
  render(toolCall: ToolCallPart): ReactNode;
}

export type Tool<
  TInputSchema extends ZodType = ZodType,
  TOutputSchema extends ZodType = ZodType,
> = ExecuteTool<TInputSchema, TOutputSchema> | DisplayTool<TInputSchema>;

export type Tools = Record<string, Tool>;

export interface ChoiceOption {
  id: string;
  label: string;
  value?: string;
  recommended?: boolean;
}

export interface ToolResultChoices {
  type: "choices";
  prompt: string;
  options: ChoiceOption[];
}

export type ToolResult = ToolResultChoices;
