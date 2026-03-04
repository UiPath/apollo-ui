import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChatCompletionRequest,
  ChatMessage,
  ToolDefinition,
  UseAiChatOptions,
  UseAiChatReturn,
} from "@/lib/ai-chat-types";
import {
  buildApiMessages,
  executeToolCall,
  getAccessToken,
  resolveConfig,
} from "@/lib/ai-chat-api";
import {
  getStorage,
  loadFromStorage,
  saveToStorage,
} from "@/lib/ai-chat-storage";

export function useAiChat(options: UseAiChatOptions): UseAiChatReturn {
  const {
    config,
    accessToken,
    storage: storageConfig,
    onToolCall,
    onError,
  } = options;

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
  const configRef = useRef(config);
  configRef.current = config;
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;
  const onToolCallRef = useRef(onToolCall);
  onToolCallRef.current = onToolCall;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const storageRef = useRef<Storage | null>(null);
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingTimersRef = useRef<Set<ReturnType<typeof setInterval>>>(
    new Set(),
  );

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

  // Cleanup on unmount — abort in-flight requests and cancel queued timers.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      for (const timer of pendingTimersRef.current) {
        clearInterval(timer);
      }
      pendingTimersRef.current.clear();
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
    async (
      content: string,
      files?: File[],
      opts?: { hidden?: boolean },
    ): Promise<void> => {
      if (!content.trim()) return;

      // Queue hidden messages while loading; they fire once the current request completes.
      if (isLoadingRef.current) {
        if (opts?.hidden) {
          const check = setInterval(() => {
            if (!isLoadingRef.current) {
              pendingTimersRef.current.delete(check);
              clearInterval(check);
              void sendMessage(content, files, opts);
            }
          }, 200);
          pendingTimersRef.current.add(check);
        }
        return;
      }

      setError(null);
      setIsLoading(true);
      isLoadingRef.current = true;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
        ...(opts?.hidden ? { hidden: true } : {}),
        ...(files?.length
          ? {
              attachments: files.map((f) => ({
                fileName: f.name,
                fileType: f.type,
                fileSize: f.size,
              })),
            }
          : {}),
      };

      // Mutable local buffer; slice() on each persist gives React a new reference.
      const currentMessages: ChatMessage[] = [
        ...messagesRef.current,
        userMessage,
      ];
      persist(currentMessages.slice());

      try {
        const maxIter = configRef.current.maxToolIterations ?? 10;
        let iterations = 0;

        while (true) {
          if (++iterations > maxIter) {
            throw new Error(`Max tool iterations (${maxIter}) exceeded`);
          }

          const cfg = configRef.current;

          // Refresh token on each iteration to handle short-lived OAuth tokens.
          const token = getAccessToken(accessTokenRef.current);
          if (!token) throw new Error("Not authenticated");

          const resolvedTools = cfg.tools
            ? resolveConfig(
                cfg.tools as ToolDefinition[] | (() => ToolDefinition[]),
              )
            : null;

          const requestBody: ChatCompletionRequest = {
            model: cfg.model,
            messages: buildApiMessages(currentMessages, cfg.systemPrompt),
            max_tokens: cfg.maxTokens ?? 2048,
            temperature: cfg.temperature ?? 0.7,
          };

          if (resolvedTools?.length) {
            requestBody.tools = resolvedTools;
            requestBody.tool_choice = cfg.toolChoice ?? "auto";
          }

          const apiVersion = cfg.apiVersion
            ? `?api-version=${cfg.apiVersion}`
            : "";
          const url = `${cfg.baseUrl}/chat/completions${apiVersion}`;

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
              content: assistantMessage.content || (cfg.fallbackResponse ?? ""),
              timestamp: Date.now(),
            });
            persist(currentMessages.slice());
            break;
          }

          const toolCalls = rawToolCalls.map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments,
          }));

          currentMessages.push({
            id: crypto.randomUUID(),
            role: "assistant",
            content: assistantMessage.content ?? "",
            timestamp: Date.now(),
            toolCalls,
          });
          persist(currentMessages.slice());

          // No handler means display-only tools — stop the loop, don't send results back to the LLM.
          if (!onToolCallRef.current) break;

          for (const tc of toolCalls) {
            const handler = onToolCallRef.current;
            let result: unknown;
            if (handler) {
              // eslint-disable-next-line no-await-in-loop
              result = await executeToolCall(handler, tc);
            } else {
              result = { error: "No tool handler configured" };
            }

            currentMessages.push({
              id: crypto.randomUUID(),
              role: "tool",
              content:
                typeof result === "string" ? result : JSON.stringify(result),
              timestamp: Date.now(),
              toolCallId: tc.id,
            });
            persist(currentMessages.slice());
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errorObj =
          err instanceof Error ? err : new Error("Unknown error");
        setError(errorObj);
        onErrorRef.current?.(errorObj);
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
    // Cancel any queued hidden messages so stop() truly halts all activity.
    for (const timer of pendingTimersRef.current) {
      clearInterval(timer);
    }
    pendingTimersRef.current.clear();
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    storageRef.current?.removeItem(storageKeyRef.current);
  }, []);

  const addSystemMessage = useCallback(
    (content: string) => {
      const systemMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "system",
        content,
        timestamp: Date.now(),
      };
      appendMessages([systemMessage]);
    },
    [appendMessages],
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stop,
    clearChat,
    addSystemMessage,
    appendMessages,
  };
}
