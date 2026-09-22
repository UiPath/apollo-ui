import { convertSchemaToJsonSchema, type AnyClientTool } from "@tanstack/ai";
import type { AgentHubVendor } from "./types";

export function buildToolDefinitions(
  tools: ReadonlyArray<AnyClientTool>,
  vendor: AgentHubVendor,
) {
  if (vendor === "anthropic") {
    return tools.map((t) => ({
      type: "custom" as const,
      name: t.name,
      description: t.description,
      input_schema: convertSchemaToJsonSchema(t.inputSchema),
    }));
  }
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: convertSchemaToJsonSchema(t.inputSchema),
  }));
}
