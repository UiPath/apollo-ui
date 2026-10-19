import {
  type AnyClientTool,
  convertSchemaToJsonSchema,
  type SchemaInput,
} from "@tanstack/ai";
import type { AgentHubVendor } from "./types";

function toJsonSchema(tool: { inputSchema?: SchemaInput }) {
  return convertSchemaToJsonSchema(tool.inputSchema);
}

export function buildToolDefinitions(
  tools: ReadonlyArray<AnyClientTool>,
  vendor: AgentHubVendor,
) {
  if (vendor === "anthropic") {
    return tools.map((t) => ({
      type: "custom" as const,
      name: t.name,
      description: t.description,
      input_schema: toJsonSchema(t),
    }));
  }
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: toJsonSchema(t),
  }));
}
