import { executeToolCall } from "./ai-chat-api";
import type { ChatMessage } from "./ai-chat-message-types";
import type { LLMProvider } from "./ai-chat-provider";
import type { Tools } from "./ai-chat-tool-types";
import { extractToolCallParts } from "./ai-chat-utils";

export interface AgentLoopOptions {
  tools?: Tools;
  maxToolIterations?: number;
}

export async function runAgentLoop(
  initialMessages: ChatMessage[],
  provider: LLMProvider,
  options: AgentLoopOptions,
  onMessage: (msg: ChatMessage) => void,
  signal: AbortSignal,
): Promise<void> {
  const buffer = [...initialMessages];
  const maxIter = options.maxToolIterations ?? 10;
  let iterations = 0;

  /* eslint-disable no-await-in-loop -- sequential awaits are intentional; each iteration depends on the previous LLM response */
  while (true) {
    if (++iterations > maxIter) {
      throw new Error(`Max tool iterations (${maxIter}) exceeded`);
    }

    const resolvedTools = options.tools;
    const assistantMsg = await provider.chat(buffer, resolvedTools, signal);
    buffer.push(assistantMsg);
    onMessage(assistantMsg);

    const toolCallParts = extractToolCallParts(assistantMsg.content);
    if (toolCallParts.length === 0) break;

    if (!resolvedTools || Object.keys(resolvedTools).length === 0) break;

    const hasDisplayTool = toolCallParts.some((tc) => {
      const handler = resolvedTools[tc.toolName];
      return handler != null && !("execute" in handler);
    });
    if (hasDisplayTool) break;

    for (const tc of toolCallParts) {
      if (signal.aborted) break;
      const result = await executeToolCall(resolvedTools, tc);
      const toolMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            result,
          },
        ],
        timestamp: Date.now(),
      };
      buffer.push(toolMsg);
      onMessage(toolMsg);
    }
  }
  /* eslint-enable no-await-in-loop */
}
