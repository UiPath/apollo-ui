"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  ChatMessage,
  ToolResultChoices,
  ToolResultNavigation,
} from "@/lib/ai-chat-types";
import { AiChat } from "@/registry/ai-chat/ai-chat";
import { useAiChat } from "@/registry/ai-chat/use-ai-chat";

const delay = (ms: number): Promise<void> =>
  new Promise((r) => {
    setTimeout(r, ms);
  });

function getMockResponses(
  userMessage: string,
  activeSection: string,
): ChatMessage[] {
  const lower = userMessage.toLowerCase();

  if (
    lower.includes("navigate") ||
    lower.includes("go to") ||
    lower.includes("section")
  ) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Here are the sections you can navigate to:",
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "tool",
        content: JSON.stringify({
          type: "navigation",
          tabs: [
            { tab: "dashboard", label: "Dashboard" },
            { tab: "reports", label: "Reports" },
            { tab: "settings", label: "Settings" },
          ],
        } satisfies ToolResultNavigation),
        timestamp: Date.now(),
      },
    ];
  }

  if (lower.includes("search") || lower.includes("find")) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        toolCalls: [
          { id: "tc1", name: "search_database", arguments: '{"query":"..."}' },
          { id: "tc2", name: "filter_results", arguments: '{"limit":10}' },
        ],
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        toolCalls: [
          { id: "tc3", name: "sort_results", arguments: '{"by":"relevance"}' },
        ],
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "I found **3 matching results** in the database. The results have been filtered and sorted by relevance.",
        timestamp: Date.now(),
      },
    ];
  }

  if (lower.includes("approve") || lower.includes("review")) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        toolCalls: [
          { id: "tc1", name: "validate_data", arguments: "{}" },
          { id: "tc2", name: "check_permissions", arguments: "{}" },
        ],
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "I've validated the data and checked your permissions. Everything looks good!",
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "tool",
        content: JSON.stringify({
          type: "choices",
          prompt: "How would you like to proceed?",
          options: [
            { id: "approve", label: "Approve Document", recommended: true },
            { id: "reject", label: "Reject Document" },
            { id: "request", label: "Request Changes" },
          ],
        } satisfies ToolResultChoices),
        timestamp: Date.now(),
      },
    ];
  }

  if (lower.includes("error") || lower.includes("fail")) {
    return [{ id: "__error__", role: "assistant", content: "", timestamp: 0 }];
  }

  if (lower.includes("hidden")) {
    return [
      {
        id: crypto.randomUUID(),
        role: "user",
        content: `System context: user is in the "${activeSection}" section.`,
        timestamp: Date.now(),
        hidden: true,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `A hidden context message was injected into the conversation (it won't appear in the UI). It told me you're currently in the **${activeSection}** section. Hidden messages are sent to the LLM but never rendered — useful for injecting context without cluttering the chat.`,
        timestamp: Date.now(),
      },
    ];
  }

  if (lower.includes("report") || lower.includes("generate")) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        toolCalls: [
          { id: "tc1", name: "fetch_data", arguments: "{}" },
          { id: "tc2", name: "generate_report", arguments: "{}" },
          { id: "tc3", name: "format_output", arguments: "{}" },
        ],
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "I've generated a comprehensive report with the latest data. The report includes:\n\n• Summary statistics\n• Trend analysis\n• Key insights\n• Recommendations",
        toolCalls: [{ id: "tc4", name: "send_notification", arguments: "{}" }],
        timestamp: Date.now(),
      },
    ];
  }

  if (lower.includes("markdown") || lower.includes("format")) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
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
| Navigation Tabs | ✅ Done |
| Hidden Messages | ✅ Done |
| Error Display | ✅ Done |

> **Note:** All markdown elements are styled to match the Apollo Design System theme.

---

Try asking about **navigate**, **search**, **approve**, **generate**, **hidden**, or **error**!`,
        timestamp: Date.now(),
      },
    ];
  }

  return [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `I received: "${userMessage}". Try asking me to:\n\n• **navigate** to a section — shows navigation tab buttons\n• **search** for something — shows grouped tool calls\n• **approve** a document — shows suggestion buttons\n• **generate** a report — shows multi-step tool grouping\n• Show **markdown** formatting — renders rich text\n• Show **hidden** message injection — invisible context messages\n• Simulate an **error** — shows the error banner`,
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
  const [activeSection, setActiveSection] = useState("home");
  const [mockError, setMockError] = useState<Error | null>(null);
  const [isMockLoading, setIsMockLoading] = useState(false);

  // useAiChat manages state, storage, and exposes appendMessages for injection.
  // Dynamic systemPrompt is a function re-evaluated on each request.
  const chat = useAiChat({
    config: {
      baseUrl: "/api/mock",
      model: "demo-model",
      systemPrompt: () =>
        `You are a helpful demo assistant. The user is in the "${activeSection}" section.`,
      fallbackResponse: "Done.",
    },
    accessToken: "demo-token",
    storage: { type: "session", messagesKey: "ai-chat-demo-v2" },
  });

  const { clearChat, appendMessages } = chat;

  const handleSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!content.trim() || isMockLoading) return;
      setMockError(null);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
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

      // Append the user message immediately via appendMessages
      appendMessages([userMsg]);

      setIsMockLoading(true);
      try {
        await delay(900);
        const responses = getMockResponses(content, activeSection);

        // Error simulation
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
    [appendMessages, activeSection, isMockLoading],
  );

  const handleClear = useCallback(() => {
    clearChat();
    setMockError(null);
    setActiveSection("home");
  }, [clearChat]);

  return (
    <div className="flex flex-col gap-3">
      {activeSection !== "home" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
          <span className="text-muted-foreground">{"Navigated to:"}</span>
          <span className="font-medium capitalize">{activeSection}</span>
          <button
            type="button"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setActiveSection("home")}
          >
            {"← Back"}
          </button>
        </div>
      )}
      <div className="h-[500px]">
        <AiChat
          messages={chat.messages}
          isLoading={isMockLoading}
          onSendMessage={handleSendMessage}
          onStop={() => setIsMockLoading(false)}
          onClearChat={handleClear}
          title={t("ai_assistant")}
          placeholder="Try: navigate · search · approve · generate · hidden · error"
          assistantName={t("assistant")}
          enableToolGrouping
          toolDisplayNames={toolDisplayNames}
          error={mockError}
          onNavigate={setActiveSection}
        />
      </div>
    </div>
  );
}

export function AiChatTemplate() {
  return <AiChatDemo />;
}
