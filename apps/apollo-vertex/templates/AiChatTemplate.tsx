"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { UIMessage } from "@tanstack/ai-client";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
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

  if (lower.includes("search") || lower.includes("find")) {
    return [
      mockUIMessage("assistant", [
        {
          type: "tool-call",
          id: "tc1",
          name: "search_database",
          arguments: '{"query":"..."}',
          state: "input-complete",
        },
        {
          type: "tool-call",
          id: "tc2",
          name: "filter_results",
          arguments: '{"limit":10}',
          state: "input-complete",
        },
      ]),
      mockUIMessage("assistant", [
        {
          type: "tool-call",
          id: "tc3",
          name: "sort_results",
          arguments: '{"by":"relevance"}',
          state: "input-complete",
        },
      ]),
      mockUIMessage("assistant", [
        {
          type: "text",
          content:
            "I found **3 matching results** in the database. The results have been filtered and sorted by relevance.",
        },
      ]),
    ];
  }

  if (lower.includes("approve") || lower.includes("review")) {
    return [
      mockUIMessage("assistant", [
        {
          type: "tool-call",
          id: "tc1",
          name: "validate_data",
          arguments: "{}",
          state: "input-complete",
        },
        {
          type: "tool-call",
          id: "tc2",
          name: "check_permissions",
          arguments: "{}",
          state: "input-complete",
        },
      ]),
      mockUIMessage("assistant", [
        {
          type: "text",
          content:
            "I've validated the data and checked your permissions. Everything looks good!",
        },
        {
          type: "tool-result",
          toolCallId: "tc2",
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

  if (lower.includes("report") || lower.includes("generate")) {
    return [
      mockUIMessage("assistant", [
        {
          type: "tool-call",
          id: "tc1",
          name: "fetch_data",
          arguments: "{}",
          state: "input-complete",
        },
        {
          type: "tool-call",
          id: "tc2",
          name: "generate_report",
          arguments: "{}",
          state: "input-complete",
        },
        {
          type: "tool-call",
          id: "tc3",
          name: "format_output",
          arguments: "{}",
          state: "input-complete",
        },
      ]),
      mockUIMessage("assistant", [
        {
          type: "text",
          content:
            "I've generated a comprehensive report with the latest data. The report includes:\n\n• Summary statistics\n• Trend analysis\n• Key insights\n• Recommendations",
        },
        {
          type: "tool-call",
          id: "tc4",
          name: "send_notification",
          arguments: "{}",
          state: "input-complete",
        },
      ]),
    ];
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
| Markdown | ✅ Done |
| Tool Calls | ✅ Done |
| Choices | ✅ Done |
| Error Display | ✅ Done |

> **Note:** All markdown elements are styled to match the Apollo Design System theme.

---

Try asking about **search**, **approve**, **generate**, or **error**!`,
        },
      ]),
    ];
  }

  return [
    mockUIMessage("assistant", [
      {
        type: "text",
        content: `I received: "${userMessage}". Try asking me to:\n\n• **search** for something — shows grouped tool calls\n• **approve** a document — shows suggestion buttons\n• **generate** a report — shows multi-step tool grouping\n• Show **markdown** formatting — renders rich text\n• Simulate an **error** — shows the error banner`,
      },
    ]),
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
