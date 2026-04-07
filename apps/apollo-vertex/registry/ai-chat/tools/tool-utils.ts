import type { AnyClientTool } from "@tanstack/ai";
import type { AiChatTool, DisplayTools } from "./tool-types";

export function extractClientTools(tools: AiChatTool[]): AnyClientTool[] {
  return tools.map((t) => t.tool);
}

export function extractDisplayTools(tools: AiChatTool[]): DisplayTools {
  const result: DisplayTools = {};
  for (const t of tools) {
    if (t.render) result[t.tool.name] = t;
  }
  return result;
}

export function extractPrompts(tools: AiChatTool[]): string {
  return tools
    .map((t) => t.prompt)
    .filter(Boolean)
    .join("\n\n");
}
