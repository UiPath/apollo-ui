"use client";

import type { UIMessage } from "@tanstack/ai-client";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

const delay = (ms: number): Promise<void> =>
  new Promise((r) => {
    setTimeout(r, ms);
  });

function mockUIMessage(
  role: "user" | "assistant",
  parts: UIMessage["parts"],
): UIMessage {
  return { id: crypto.randomUUID(), role, parts };
}

function getMockResponses(userMessage: string): UIMessage[] {
  const lower = userMessage.toLowerCase();

  if (lower.includes("approve") || lower.includes("review")) {
    return [
      mockUIMessage("assistant", [
        {
          type: "text",
          content:
            "I've validated the data and checked your permissions. Everything looks good!",
        },
        {
          type: "tool-result",
          toolCallId: "tc1",
          content: JSON.stringify({
            type: "choices",
            prompt: "How would you like to proceed?",
            options: [
              { id: "approve", label: "Approve Document", recommended: true },
              { id: "reject", label: "Reject Document" },
              { id: "request", label: "Request Changes" },
            ],
          }),
          state: "complete",
        },
      ]),
    ];
  }

  if (lower.includes("error") || lower.includes("fail")) {
    return [{ id: "__error__", role: "assistant", parts: [] }];
  }

  if (lower.includes("markdown") || lower.includes("format")) {
    return [
      mockUIMessage("assistant", [
        {
          type: "text",
          content: `# Markdown Rendering Demo

This chat component supports **full markdown formatting** with *GitHub Flavored Markdown* extensions!

## Text Formatting

You can use **bold text**, *italic text*, and \`inline code\` in your responses.

## Lists

**Bullet lists:**
- First item
- Second item
- Third item

**Numbered lists:**
1. Step one
2. Step two
3. Step three

## Code Blocks

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Tables

| Feature | Status |
|---------|--------|
| Markdown | ✅ Supported |
| Choices | ✅ Supported |
| Error Display | ✅ Supported |

> **Note:** All markdown elements are styled to match the Apollo Design System theme.`,
        },
      ]),
    ];
  }

  return [
    mockUIMessage("assistant", [
      {
        type: "text",
        content: `I received: "${userMessage}". Try asking me to:\n\n• **approve** a document — shows suggestion buttons\n• Show **markdown** formatting — renders rich text\n• Simulate an **error** — shows the error banner`,
      },
    ]),
  ];
}

function AiChatDemo() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [mockError, setMockError] = useState<Error | null>(null);
  const [isMockLoading, setIsMockLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isMockLoading) return;
      setMockError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg = mockUIMessage("user", [{ type: "text", content }]);

      setMessages((prev) => [...prev, userMsg]);

      setIsMockLoading(true);
      try {
        await delay(900);
        if (controller.signal.aborted) return;

        const responses = getMockResponses(content);

        if (responses[0]?.id === "__error__") {
          setMockError(
            new Error("Connection failed: Unable to reach the AI service."),
          );
          return;
        }

        setMessages((prev) => [...prev, ...responses]);
      } finally {
        abortRef.current = null;
        setIsMockLoading(false);
      }
    },
    [isMockLoading],
  );

  const handleClear = useCallback(() => {
    setMessages([]);
    setMockError(null);
  }, []);

  return (
    <div className="h-[500px]">
      <AiChat
        messages={messages}
        isLoading={isMockLoading}
        onSendMessage={handleSendMessage}
        onStop={() => {
          abortRef.current?.abort();
          abortRef.current = null;
          setIsMockLoading(false);
        }}
        onClearChat={handleClear}
        title={t("ai_assistant")}
        placeholder="Try: approve · markdown · error"
        assistantName={t("assistant")}
        error={mockError}
      >
        {messages.map((message) => (
          <AiChatMessage
            key={message.id}
            message={message}
            assistantName={t("assistant")}
          />
        ))}
      </AiChat>
    </div>
  );
}

export function AiChatTemplate() {
  return (
    <LocaleProvider>
      <AiChatDemo />
    </LocaleProvider>
  );
}
