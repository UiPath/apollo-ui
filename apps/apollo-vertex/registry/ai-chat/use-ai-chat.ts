import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChatCompletionRequest,
  ChatMessage,
  LLMMessage,
  ToolCall,
  UseAiChatOptions,
  UseAiChatReturn,
} from "@/lib/ai-chat-types";

function getStorage(type: "session" | "local" | "none"): Storage | null {
  if (typeof window === "undefined" || type === "none") return null;
  return type === "session" ? sessionStorage : localStorage;
}

function loadFromStorage<T>(
  storage: Storage | null,
  key: string,
  defaultValue: T,
): T {
  if (!storage) return defaultValue;
  try {
    const stored = storage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.warn(`Failed to load ${key} from storage:`, error);
  }
  return defaultValue;
}

function saveToStorage<T>(
  storage: Storage | null,
  key: string,
  value: T,
): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to storage:`, error);
  }
}

function buildApiMessages(
  messages: ChatMessage[],
  systemPrompt?: string,
): LLMMessage[] {
  const apiMessages: LLMMessage[] = [];

  if (systemPrompt) {
    apiMessages.push({ role: "system", content: systemPrompt });
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg) continue;

    if (msg.role === "system") continue;

    // For tool result messages, only include them when the preceding API message
    // already has tool_calls (i.e. we're in a full tool-execution flow).
    if (msg.role === "tool") {
      const prev = apiMessages[apiMessages.length - 1];
      if (prev?.tool_calls) {
        apiMessages.push({ role: "tool", content: msg.content });
      }
      continue;
    }

    const apiMsg: LLMMessage = { role: msg.role, content: msg.content };

    // Only include tool_calls in the API message when there are actual tool result
    // messages following this one in the history. Without results the API would
    // reject the request as malformed. When tool calls are rendered client-side
    // (no result messages), we just forward the text content.
    if (msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0) {
      const hasToolResults = messages.slice(i + 1).some((m) => m.role === "tool");
      if (hasToolResults) {
        apiMsg.tool_calls = msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.arguments },
        }));
      }
    }

    apiMessages.push(apiMsg);
  }

  return apiMessages;
}

function getAccessToken(token: string | (() => string | null)): string | null {
  if (typeof token === "function") {
    return token();
  }
  return token;
}

export function useAiChat(options: UseAiChatOptions): UseAiChatReturn {
  const {
    config,
    accessToken,
    storage: storageConfig,
    onToolCall,
    onError,
  } = options;

  const storage = getStorage(storageConfig?.type ?? "session");
  const storageKey = storageConfig?.messagesKey ?? "ai_chat_messages";

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadFromStorage(storage, storageKey, []),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (messages.length > 0) {
      saveToStorage(storage, storageKey, messages);
    }
  }, [messages, storage, storageKey]);

  const sendMessage = useCallback(
    async (content: string, files?: File[]): Promise<void> => {
      if ((!content.trim() && (!files || files.length === 0)) || isLoading)
        return;

      setError(null);
      setIsLoading(true);

      const messageContent = content.trim();
      const attachments =
        files && files.length > 0
          ? files.map((file) => ({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            }))
          : undefined;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: messageContent,
        timestamp: Date.now(),
        attachments,
      };
      setMessages((prev) => [...prev, userMessage]);

      abortControllerRef.current = new AbortController();

      try {
        const apiMessages = buildApiMessages(
          [...messages, userMessage],
          config.systemPrompt,
        );

        const token = getAccessToken(accessToken);
        if (!token) {
          throw new Error("Not authenticated");
        }

        const requestBody: ChatCompletionRequest = {
          model: config.model,
          messages: apiMessages,
          max_tokens: config.maxTokens ?? 2048,
          temperature: config.temperature ?? 0.7,
        };

        if (config.tools && config.tools.length > 0) {
          requestBody.tools = config.tools;
          requestBody.tool_choice = config.toolChoice ?? "auto";
        }

        const apiVersion = config.apiVersion ? `?api-version=${config.apiVersion}` : "";
        const url = `${config.baseUrl}/chat/completions${apiVersion}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Chat request failed: ${response.status} ${errorText}`,
          );
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        const assistantMessage = choice?.message;

        if (!assistantMessage) {
          throw new Error("No response from assistant");
        }

        let toolCalls: ToolCall[] | undefined;
        if (
          assistantMessage.tool_calls &&
          assistantMessage.tool_calls.length > 0
        ) {
          toolCalls = assistantMessage.tool_calls.map(
            (tc: {
              id: string;
              function: { name: string; arguments: string };
            }) => ({
              id: tc.id,
              name: tc.function.name,
              arguments: tc.function.arguments,
            }),
          );

          if (onToolCall && toolCalls) {
            for (const tc of toolCalls) {
              try {
                const args = JSON.parse(tc.arguments) as Record<
                  string,
                  unknown
                >;
                await onToolCall(tc, args);
              } catch (toolError) {
                console.error("Tool call error:", toolError);
              }
            }
          }
        }

        const assistantChatMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantMessage.content || "",
          timestamp: Date.now(),
          toolCalls,
        };
        setMessages((prev) => [...prev, assistantChatMessage]);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const errorObj =
          err instanceof Error ? err : new Error("Unknown error");
        setError(errorObj);
        onError?.(errorObj);

        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorObj.message}. Please try again.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isLoading, config, accessToken, onToolCall, onError],
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    if (storage) {
      storage.removeItem(storageKey);
    }
  }, [storage, storageKey]);

  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "system",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, systemMessage]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stop,
    clearChat,
    addSystemMessage,
  };
}
