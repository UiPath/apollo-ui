import { z } from "zod";
import type { Tools } from "../../../ai-chat-tool-types";

/**
 * Builds OpenAI-native tool definitions for the AgentHub OpenAI endpoint.
 * Uses the standard `function` type with a JSON Schema `parameters` field.
 */
export function buildOpenAIToolDefinitions(tools: Tools) {
  return Object.entries(tools).map(([name, tool]) => ({
    type: "function" as const,
    function: {
      name,
      description: tool.description,
      parameters: z.toJSONSchema(tool.inputSchema),
    },
  }));
}
