import { toolDefinition } from "@tanstack/ai";
import type { AnyClientTool } from "@tanstack/ai";
import type { ReactNode } from "react";
import type { ZodType, z } from "zod";
import type { AiChatTool, DisplayTools } from "./tool-types";

/**
 * Factory for creating display tools with type-safe Zod schemas.
 * Uses standard TanStack AI toolDefinition().client() under the hood.
 */
export function createDisplayTool<TInput extends ZodType>(options: {
  name: string;
  description: string;
  inputSchema: TInput;
  prompt: string;
  render: (
    args: z.infer<TInput>,
    context: { onAction: (message: string) => void },
  ) => ReactNode;
}): AiChatTool {
  const def = toolDefinition({
    name: options.name,
    description: options.description,
    inputSchema: options.inputSchema,
  });
  return {
    tool: def.client((input) => input),
    prompt: options.prompt,
    render: options.render as AiChatTool["render"],
  };
}

/**
 * Extract AnyClientTool[] for TanStack AI useChat/connection.
 */
export function extractClientTools(tools: AiChatTool[]): AnyClientTool[] {
  return tools.map((t) => t.tool);
}

/**
 * Extract display tools record for AiChatMessage rendering.
 */
export function extractDisplayTools(tools: AiChatTool[]): DisplayTools {
  const result: DisplayTools = {};
  for (const t of tools) {
    if (t.render) result[t.tool.name] = t;
  }
  return result;
}

/**
 * Combine system prompt snippets from all tools.
 */
export function extractPrompts(tools: AiChatTool[]): string {
  return tools
    .map((t) => t.prompt)
    .filter(Boolean)
    .join("\n\n");
}
