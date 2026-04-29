import { EventType, type StreamChunk } from "@tanstack/ai";
import type { UIMessage } from "@tanstack/ai-client";
import { EventSourceParserStream } from "eventsource-parser/stream";
import { z } from "zod/v4";
import { toNormalizedMessages } from "./messages";
import { buildToolDefinitions } from "./tools";
import type { AgentHubAdapterConfig } from "./types";

declare global {
  interface ReadableStream<R> {
    [Symbol.asyncIterator](): AsyncIterator<R>;
  }
}

export async function* fetchAgentHubStream(
  config: AgentHubAdapterConfig,
  messages: UIMessage[],
  signal?: AbortSignal,
): AsyncIterable<StreamChunk> {
  const token =
    typeof config.accessToken === "function"
      ? config.accessToken()
      : config.accessToken;
  if (!token) throw new Error("Not authenticated");

  const url = `${config.baseUrl}/chat/completions`;
  const systemPrompt =
    typeof config.systemPrompt === "function"
      ? config.systemPrompt()
      : config.systemPrompt;

  const body: Record<string, unknown> = {
    model: config.model.name,
    messages: toNormalizedMessages(messages, systemPrompt, config.model.vendor),
    max_tokens: config.maxTokens ?? 2048,
    temperature: config.temperature ?? 0.7,
    stream: true,
  };

  if (config.tools && config.tools.length > 0) {
    body["tools"] = buildToolDefinitions(config.tools, config.model.vendor);
    body["tool_choice"] = { type: "auto" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-UiPath-LlmGateway-NormalizedApi-ModelName": config.model.name,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AgentHub API error: ${response.status} - ${error}`);
  }

  if (!response.body) throw new Error("No response body");

  yield* toStreamChunks(response.body);
}

// ---------------------------------------------------------------------------
// AG-UI event mapping
// ---------------------------------------------------------------------------

/**
 * OpenAI-compatible streaming chunk shape (Chat Completions SSE format).
 *
 * Each SSE chunk is a partial delta — fields are only present when they
 * carry new data for that specific chunk, hence everything is optional.
 *
 * @see https://platform.openai.com/docs/api-reference/chat/streaming
 */
const OpenAIChatStreamChunkSchema = z.object({
  choices: z.array(
    z.object({
      finish_reason: z.string().nullable().optional(),
      delta: z.object({
        content: z.string().optional(),
        tool_calls: z
          .array(
            z.object({
              index: z.number(),
              id: z.string().optional(),
              function: z
                .object({
                  name: z.string().optional(),
                  arguments: z.string().optional(),
                })
                .optional(),
            }),
          )
          .optional(),
      }),
    }),
  ),
});

type OpenAIChatStreamChunk = z.infer<typeof OpenAIChatStreamChunkSchema>;

type ToolCallDelta = NonNullable<
  OpenAIChatStreamChunk["choices"][number]["delta"]["tool_calls"]
>[number];

function* handleToolCallDelta(
  tc: ToolCallDelta,
  toolCalls: Map<number, { id: string; name: string; arguments: string }>,
  parentMessageId: string,
): Generator<StreamChunk> {
  const idx = tc.index ?? 0;
  const fn = tc.function;

  if (toolCalls.has(idx)) {
    const existing = toolCalls.get(idx);
    if (fn?.arguments && existing) {
      existing.arguments += fn.arguments;
      yield {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: existing.id,
        delta: fn.arguments,
        timestamp: Date.now(),
      };
    }
    return;
  }

  const id = tc.id ?? crypto.randomUUID();
  const name = fn?.name ?? "";
  toolCalls.set(idx, { id, name, arguments: fn?.arguments ?? "" });
  yield {
    type: EventType.TOOL_CALL_START,
    toolCallId: id,
    toolCallName: name,
    toolName: name,
    parentMessageId,
    timestamp: Date.now(),
  };
  if (fn?.arguments) {
    yield {
      type: EventType.TOOL_CALL_ARGS,
      toolCallId: id,
      delta: fn.arguments,
      timestamp: Date.now(),
    };
  }
}

async function* toStreamChunks(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<StreamChunk> {
  const messageId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const threadId = crypto.randomUUID();

  yield { type: EventType.RUN_STARTED, runId, threadId, timestamp: Date.now() };
  yield {
    type: EventType.TEXT_MESSAGE_START,
    messageId,
    role: "assistant",
    timestamp: Date.now(),
  };

  let finishReason: string | null = null;
  const toolCalls = new Map<
    number,
    { id: string; name: string; arguments: string }
  >();

  const eventStream = body
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- TextDecoderStream is a TransformStream<Uint8Array, string> but TS lib types are wider
    .pipeThrough(new TextDecoderStream() as TransformStream<Uint8Array, string>)
    .pipeThrough(new EventSourceParserStream());

  for await (const event of eventStream) {
    if (event.data === "[DONE]") break;

    let json: unknown;
    try {
      json = JSON.parse(event.data);
    } catch {
      continue;
    }
    const chunkResult = OpenAIChatStreamChunkSchema.safeParse(json);
    if (!chunkResult.success) continue;
    const chunk = chunkResult.data;

    const choice = chunk.choices?.[0];
    if (!choice) continue;

    if (choice.finish_reason) {
      finishReason = choice.finish_reason;
    }

    const delta = choice.delta;

    if (delta?.content) {
      yield {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId,
        delta: delta.content,
        timestamp: Date.now(),
      };
    }

    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        yield* handleToolCallDelta(tc, toolCalls, messageId);
      }
    }
  }

  // Close open tool calls and trigger client-side execution
  for (const [, tc] of toolCalls) {
    yield {
      type: EventType.TOOL_CALL_END,
      toolCallId: tc.id,
      toolCallName: tc.name,
      toolName: tc.name,
      timestamp: Date.now(),
    };
    let parsedInput: unknown = {};
    try {
      parsedInput = JSON.parse(tc.arguments);
    } catch {
      /* empty */
    }
    yield {
      type: EventType.CUSTOM,
      name: "tool-input-available",
      value: {
        toolCallId: tc.id,
        toolName: tc.name,
        input: parsedInput,
      },
      timestamp: Date.now(),
    };
  }
  yield {
    type: EventType.TEXT_MESSAGE_END,
    messageId,
    timestamp: Date.now(),
  };
  yield {
    type: EventType.RUN_FINISHED,
    runId,
    threadId,
    timestamp: Date.now(),
    finishReason: finishReason === "tool_calls" ? "tool_calls" : "stop",
  };
}
