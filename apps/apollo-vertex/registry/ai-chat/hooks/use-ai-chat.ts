import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildApiMessages,
  buildToolDefinitions,
  executeToolCall,
  getAccessToken,
  resolveConfig,
} from "../utils/ai-chat-api";
import type {
  ChatMessage,
  TextPart,
  ToolCallPart,
} from "../utils/ai-chat-message-types";
import {
  getStorage,
  loadFromStorage,
  saveToStorage,
} from "../utils/ai-chat-storage";
import type { UseAiChatOptions, UseAiChatReturn } from "../utils/ai-chat-types";

export function useAiChat(options: UseAiChatOptions): UseAiChatReturn {
  const { connection, storage: storageConfig } = options;

  const storageType = storageConfig?.type ?? "session";
  const storageKey = storageConfig?.messagesKey ?? "ai_chat_messages";

  // Initialize empty to avoid SSR/client hydration mismatch; storage is browser-only.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for synchronous access in async callbacks
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const connectionRef = useRef(connection);
  connectionRef.current = connection;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const storageRef = useRef<Storage | null>(null);
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize storage and load persisted messages after mount (SSR-safe).
  useEffect(() => {
    storageRef.current = getStorage(storageType);
    setMessages(loadFromStorage(storageRef.current, storageKeyRef.current, []));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset messages when storageKey changes (per-context storage reset).
  const prevStorageKeyRef = useRef(storageKey);
  useEffect(() => {
    if (prevStorageKeyRef.current !== storageKey) {
      prevStorageKeyRef.current = storageKey;
      setMessages(loadFromStorage(storageRef.current, storageKey, []));
    }
  }, [storageKey]);

  // Cleanup on unmount — abort in-flight requests.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const persist = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
    saveToStorage(storageRef.current, storageKeyRef.current, msgs);
  }, []);

  const appendMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages((prev) => {
      const next = [...prev, ...msgs];
      saveToStorage(storageRef.current, storageKeyRef.current, next);
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim() || isLoadingRef.current) return;

      setError(null);
      setIsLoading(true);
      isLoadingRef.current = true;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const opts = optionsRef.current;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: [{ type: "text", text: content.trim() }],
        timestamp: Date.now(),
      };

      // Mutable local buffer; slice() on each persist gives React a new reference.
      const currentMessages: ChatMessage[] = [
        ...messagesRef.current,
        userMessage,
      ];
      persist(currentMessages.slice());

      try {
        const maxIter = opts.maxToolIterations ?? 10;
        let iterations = 0;

        while (true) {
          if (++iterations > maxIter) {
            throw new Error(`Max tool iterations (${maxIter}) exceeded`);
          }

          const conn = connectionRef.current;

          // Refresh token on each iteration to handle short-lived OAuth tokens.
          const token = getAccessToken(conn.accessToken);
          if (!token) throw new Error("Not authenticated");

          const resolvedTools = opts.tools ? resolveConfig(opts.tools) : null;

          const requestBody: Record<string, unknown> = {
            model: conn.model,
            messages: buildApiMessages(currentMessages, opts.systemPrompt),
            max_tokens: opts.maxTokens ?? 2048,
            temperature: opts.temperature ?? 0.7,
          };

          if (resolvedTools && Object.keys(resolvedTools).length > 0) {
            requestBody["tools"] = buildToolDefinitions(resolvedTools);
            requestBody["tool_choice"] = opts.toolChoice ?? "auto";
          }

          const apiVersion = conn.apiVersion
            ? `?api-version=${conn.apiVersion}`
            : "";
          const url = `${conn.baseUrl}/chat/completions${apiVersion}`;

          // eslint-disable-next-line no-await-in-loop
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          if (!response.ok) {
            // eslint-disable-next-line no-await-in-loop
            const errorText = await response.text();
            throw new Error(
              `Chat request failed: ${response.status} ${errorText}`,
            );
          }

          // eslint-disable-next-line no-await-in-loop
          const data = await response.json();
          const assistantMessage = data.choices?.[0]?.message;
          if (!assistantMessage) throw new Error("No response from assistant");

          const rawToolCalls = assistantMessage.tool_calls as
            | Array<{
                id: string;
                function: { name: string; arguments: string };
              }>
            | undefined;

          if (!rawToolCalls?.length) {
            currentMessages.push({
              id: crypto.randomUUID(),
              role: "assistant",
              content: [
                {
                  type: "text",
                  text:
                    assistantMessage.content || (opts.fallbackResponse ?? ""),
                },
              ],
              timestamp: Date.now(),
            });
            persist(currentMessages.slice());
            break;
          }

          const toolCallParts: ToolCallPart[] = rawToolCalls.map((tc) => ({
            type: "tool-call",
            toolCallId: tc.id,
            toolName: tc.function.name,
            args: JSON.parse(tc.function.arguments) as Record<string, unknown>,
          }));

          // Build assistant message content: text (if any) + tool call parts
          const assistantContent: Array<TextPart | ToolCallPart> = [];
          if (assistantMessage.content) {
            assistantContent.push({
              type: "text",
              text: assistantMessage.content,
            });
          }
          assistantContent.push(...toolCallParts);

          currentMessages.push({
            id: crypto.randomUUID(),
            role: "assistant",
            content: assistantContent,
            timestamp: Date.now(),
          });
          persist(currentMessages.slice());

          // No tools map — stop the loop, don't send results back to the LLM.
          if (!resolvedTools || Object.keys(resolvedTools).length === 0) break;

          // If any tool in this batch is a DisplayTool (no execute), stop the loop entirely.
          const hasDisplayTool = toolCallParts.some((tc) => {
            const handler = resolvedTools[tc.toolName];
            return handler != null && !("execute" in handler);
          });
          if (hasDisplayTool) break;

          for (const tc of toolCallParts) {
            // eslint-disable-next-line no-await-in-loop
            const result = await executeToolCall(resolvedTools, tc);

            currentMessages.push({
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
            });
            persist(currentMessages.slice());
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errorObj =
          err instanceof Error ? err : new Error("Unknown error");
        setError(errorObj);
        opts.onError?.(errorObj);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [persist],
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    storageRef.current?.removeItem(storageKeyRef.current);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stop,
    clearChat,
    appendMessages,
  };
}
