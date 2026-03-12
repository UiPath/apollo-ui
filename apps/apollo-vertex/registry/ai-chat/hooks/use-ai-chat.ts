import { useCallback, useEffect, useRef, useState } from "react";
import { resolveConfig } from "../utils/ai-chat-api";
import { runAgentLoop } from "../utils/ai-chat-loop";
import type {
  AssistantMessage,
  ChatMessage,
} from "../utils/ai-chat-message-types";
import type { UseAiChatOptions, UseAiChatReturn } from "../utils/ai-chat-types";

function loadMessages(key: string | undefined): ChatMessage[] {
  if (!key) return [];
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(key: string | undefined, msgs: ChatMessage[]): void {
  if (!key) return;
  try {
    if (msgs.length === 0) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(msgs));
    }
  } catch {
    // ignore storage errors
  }
}

export function useAiChat(options: UseAiChatOptions): UseAiChatReturn {
  const { provider, storageKey } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadMessages(storageKey),
  );
  const [streamingMessage, setStreamingMessage] =
    useState<AssistantMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const tools = options.tools ? resolveConfig(options.tools) : options.tools;

  useEffect(() => {
    setMessages(loadMessages(storageKey));
  }, [storageKey]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const persist = useCallback(
    (msgs: ChatMessage[]) => {
      setMessages(msgs);
      saveMessages(storageKey, msgs);
    },
    [storageKey],
  );

  const appendMessages = useCallback(
    (msgs: ChatMessage[]) => {
      setMessages((prev) => {
        const next = [...prev, ...msgs];
        saveMessages(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const sendMessage = async (content: string): Promise<void> => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: [{ type: "text", text: content.trim() }],
      timestamp: Date.now(),
    };

    const initialMessages = [...messages, userMessage];
    persist(initialMessages);

    try {
      await runAgentLoop(
        initialMessages,
        provider,
        {
          tools,
          maxToolIterations: options.maxToolIterations,
          onStreamDelta: (partial) => setStreamingMessage(partial),
        },
        (msg) => {
          if (msg.role === "assistant") setStreamingMessage(null);
          setMessages((prev) => {
            const next = [...prev, msg];
            saveMessages(storageKey, next);
            return next;
          });
        },
        controller.signal,
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorObj = err instanceof Error ? err : new Error("Unknown error");
      setError(errorObj);
      options.onError?.(errorObj);
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
      abortControllerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    if (storageKey) sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    messages: streamingMessage ? [...messages, streamingMessage] : messages,
    isLoading,
    error,
    tools,
    sendMessage,
    stop,
    clearChat,
    appendMessages,
  };
}
