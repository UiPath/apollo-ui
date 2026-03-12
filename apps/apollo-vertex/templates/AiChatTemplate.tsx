"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { useAiChat } from "@/registry/ai-chat/hooks/use-ai-chat";
import type {
  ChatMessage,
  ToolResultChoices,
} from "@/registry/ai-chat/utils/ai-chat-types";
import { OpenAIChatProvider } from "@/registry/ai-chat/utils/providers/openai/openai-provider";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

const delay = (ms: number): Promise<void> =>
  new Promise((r) => {
    setTimeout(r, ms);
  });

function getMockResponses(userMessage: string): ChatMessage[] {
  const lower = userMessage.toLowerCase();

  if (lower.includes("search") || lower.includes("find")) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: [
          {
            type: "tool-call",
            toolCallId: "tc1",
            toolName: "search_database",
            args: { query: "..." },
          },
          {
            type: "tool-call",
            toolCallId: "tc2",
            toolName: "filter_results",
            args: { limit: 10 },
          },
        ],
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: [
          {
            type: "tool-call",
            toolCallId: "tc3",
            toolName: "sort_results",
            args: { by: "relevance" },
          },
        ],
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: [
          {
            type: "text",
            text: "I found **3 matching results** in the database. The results have been filtered and sorted by relevance.",
          },
        ],
        timestamp: Date.now(),
      },
    ];
  }

  if (lower.includes("approve") || lower.includes("review")) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: [
          {
            type: "tool-call",
            toolCallId: "tc1",
            toolName: "validate_data",
            args: {},
          },
          {
            type: "tool-call",
            toolCallId: "tc2",
            toolName: "check_permissions",
            args: {},
          },
        ],
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: [
          {
            type: "text",
            text: "I've validated the data and checked your permissions. Everything looks good!",
          },
        ],
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "tc2",
            toolName: "check_permissions",
            result: {
              type: "choices",
              prompt: "How would you like to proceed?",
              options: [
                { id: "approve", label: "Approve Document", recommended: true },
                { id: "reject", label: "Reject Document" },
                { id: "request", label: "Request Changes" },
              ],
            } satisfies ToolResultChoices,
          },
        ],
        timestamp: Date.now(),
      },
    ];
  }

  if (lower.includes("error") || lower.includes("fail")) {
    return [{ id: "__error__", role: "assistant", content: [], timestamp: 0 }];
  }

  if (lower.includes("report") || lower.includes("generate")) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: [
          {
            type: "tool-call",
            toolCallId: "tc1",
            toolName: "fetch_data",
            args: {},
          },
          {
            type: "tool-call",
            toolCallId: "tc2",
            toolName: "generate_report",
            args: {},
          },
          {
            type: "tool-call",
            toolCallId: "tc3",
            toolName: "format_output",
            args: {},
          },
        ],
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: [
          {
            type: "text",
            text: "I've generated a comprehensive report with the latest data. The report includes:\n\n• Summary statistics\n• Trend analysis\n• Key insights\n• Recommendations",
          },
          {
            type: "tool-call",
            toolCallId: "tc4",
            toolName: "send_notification",
            args: {},
          },
        ],
        timestamp: Date.now(),
      },
    ];
  }

  if (lower.includes("markdown") || lower.includes("format")) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: [
          {
            type: "text",
            text: `# Markdown Rendering Demo

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
| Markdown | ✅ Done |
| Tool Calls | ✅ Done |
| Choices | ✅ Done |
| Error Display | ✅ Done |

> **Note:** All markdown elements are styled to match the Apollo Design System theme.

---

Try asking about **search**, **approve**, **generate**, or **error**!`,
          },
        ],
        timestamp: Date.now(),
      },
    ];
  }

  return [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: [
        {
          type: "text",
          text: `I received: "${userMessage}". Try asking me to:\n\n• **search** for something — shows grouped tool calls\n• **approve** a document — shows suggestion buttons\n• **generate** a report — shows multi-step tool grouping\n• Show **markdown** formatting — renders rich text\n• Simulate an **error** — shows the error banner`,
        },
      ],
      timestamp: Date.now(),
    },
  ];
}

const toolDisplayNames: Record<string, string> = {
  search_database: "Searching Database",
  filter_results: "Filtering Results",
  sort_results: "Sorting Results",
  validate_data: "Validating Data",
  check_permissions: "Checking Permissions",
  fetch_data: "Fetching Data",
  generate_report: "Generating Report",
  format_output: "Formatting Output",
  send_notification: "Sending Notification",
};

function AiChatDemo() {
  const { t } = useTranslation();
  const [mockError, setMockError] = useState<Error | null>(null);
  const [isMockLoading, setIsMockLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const chat = useAiChat({
    provider: new OpenAIChatProvider({
      baseUrl: "/api/mock",
      model: "demo-model",
      accessToken: "demo-token",
      systemPrompt: "You are a helpful demo assistant.",
    }),
  });

  const { clearChat, appendMessages } = chat;

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isMockLoading) return;
      setMockError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: [{ type: "text", text: content }],
        timestamp: Date.now(),
      };

      appendMessages([userMsg]);

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

        appendMessages(responses);
      } finally {
        setIsMockLoading(false);
      }
    },
    [appendMessages, isMockLoading],
  );

  const handleClear = useCallback(() => {
    clearChat();
    setMockError(null);
  }, [clearChat]);

  return (
    <div className="h-[500px]">
      <AiChat
        messages={chat.messages}
        isLoading={isMockLoading}
        onSendMessage={handleSendMessage}
        onStop={() => {
          abortRef.current?.abort();
          setIsMockLoading(false);
        }}
        onClearChat={handleClear}
        title={t("ai_assistant")}
        placeholder="Try: search · approve · generate · markdown · error"
        assistantName={t("assistant")}
        enableToolGrouping
        toolDisplayNames={toolDisplayNames}
        error={mockError}
      />
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
