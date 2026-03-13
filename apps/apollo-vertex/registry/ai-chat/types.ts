import type { ReactNode } from "react";
import type { ZodType, z } from "zod";

export interface DisplayTool<T extends ZodType = ZodType> {
  inputSchema: T;
  render: (args: z.infer<T>) => ReactNode;
}

export type ToolRenderers = Record<string, DisplayTool>;

export function toolRenderer<TInput extends ZodType>(
  toolDef: { name: string; inputSchema?: TInput },
  render: (args: z.infer<TInput>) => ReactNode,
): [string, DisplayTool<TInput>] {
  if (!toolDef.inputSchema) {
    throw new Error(
      `Tool "${toolDef.name}" requires an inputSchema for rendering`,
    );
  }
  return [toolDef.name, { inputSchema: toolDef.inputSchema, render }];
}

export function buildToolRenderers(
  ...entries: Array<[string, DisplayTool]>
): ToolRenderers {
  return Object.fromEntries(entries);
}

export type { ChoiceOption, ToolResultChoices } from "./utils/ai-chat-utils";
