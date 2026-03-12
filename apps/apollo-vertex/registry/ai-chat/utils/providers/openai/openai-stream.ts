import type {
  AssistantMessage,
  TextPart,
  ToolCallPart,
} from "../../ai-chat-message-types";

interface ToolCallChunk {
  index: number;
  id?: string;
  function?: { name?: string; arguments?: string };
}

interface StreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
      tool_calls?: ToolCallChunk[];
    };
  }>;
}

type ToolAccumulator = { id: string; name: string; args: string };

function accumulateToolCall(
  accumulators: Map<number, ToolAccumulator>,
  tc: ToolCallChunk,
): void {
  const acc = accumulators.get(tc.index) ?? { id: "", name: "", args: "" };
  if (tc.id) acc.id = tc.id;
  if (tc.function?.name) acc.name += tc.function.name;
  if (tc.function?.arguments) acc.args += tc.function.arguments;
  accumulators.set(tc.index, acc);
}

/**
 * Reads an OpenAI-compatible SSE streaming response body and yields partial
 * AssistantMessages as tokens arrive, with a final yield that includes any
 * resolved tool calls.
 */
export async function* readOpenAIStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<AssistantMessage> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let lineBuffer = "";
  let accText = "";
  const msgId = crypto.randomUUID();
  const msgTimestamp = Date.now();

  // Tool call args arrive fragmented across chunks — accumulate by index.
  const toolAccumulators = new Map<number, ToolAccumulator>();

  try {
    outer: while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) break;

      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const payload = trimmed.slice(6).trim();
        if (payload === "[DONE]") break outer;

        let chunk: StreamChunk;
        try {
          chunk = JSON.parse(payload) as StreamChunk;
        } catch {
          continue;
        }

        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          accText += delta.content;
          yield {
            id: msgId,
            role: "assistant",
            content: [{ type: "text", text: accText }],
            timestamp: msgTimestamp,
          };
        }

        delta.tool_calls?.forEach((tc) =>
          accumulateToolCall(toolAccumulators, tc),
        );
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Yield final message with resolved tool calls.
  // For text-only responses the last yield above is already complete;
  // this only fires when tool calls are present.
  if (toolAccumulators.size > 0) {
    const toolCallParts: ToolCallPart[] = Array.from(toolAccumulators.entries())
      .toSorted(([a], [b]) => a - b)
      .map(([, acc]) => {
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(acc.args) as Record<string, unknown>;
        } catch {
          args = {};
        }
        return {
          type: "tool-call" as const,
          toolCallId: acc.id,
          toolName: acc.name,
          args,
        };
      });

    const content: Array<TextPart | ToolCallPart> = [];
    if (accText) content.push({ type: "text", text: accText });
    content.push(...toolCallParts);

    yield { id: msgId, role: "assistant", content, timestamp: msgTimestamp };
  }
}
