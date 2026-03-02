import type { ToolCallPart } from "./ai-chat-message-types";
import type { Tools } from "./ai-chat-tool-types";

export function resolveConfig<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export function getAccessToken(
  token: string | (() => string | null),
): string | null {
  return typeof token === "function" ? token() : token;
}

export async function executeToolCall(
  tools: Tools,
  tc: ToolCallPart,
): Promise<unknown> {
  const handler = tools[tc.toolName];
  if (!handler || !("execute" in handler)) {
    return { error: `Unknown tool: ${tc.toolName}` };
  }
  const parsed = handler.inputSchema.safeParse(tc.args);
  if (!parsed.success) {
    return { error: `Invalid tool arguments: ${parsed.error.message}` };
  }
  try {
    const result = await handler.execute(parsed.data);
    if (handler.outputSchema) {
      const outputParsed = handler.outputSchema.safeParse(result);
      if (!outputParsed.success) {
        return { error: `Invalid tool output: ${outputParsed.error.message}` };
      }
      return outputParsed.data;
    }
    return result;
  } catch (err) {
    return { error: String(err) };
  }
}
