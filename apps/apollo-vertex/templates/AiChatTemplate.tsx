"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AiChat } from "@/registry/ai-chat/ai-chat";
import type { ChatMessage, ToolResultChoices } from "@/registry/ai-chat/ai-chat-types";

function getMockResponse(userMessage: string): ChatMessage[] {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("search") || lowerMessage.includes("find")) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        toolCalls: [
          { id: "tc1", name: "search_database", arguments: "{}" },
          { id: "tc2", name: "filter_results", arguments: "{}" },
        ],
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        toolCalls: [{ id: "tc3", name: "sort_results", arguments: "{}" }],
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

  if (lowerMessage.includes("approve") || lowerMessage.includes("review")) {
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
            {
              id: "approve",
              label: "Approve Document",
              recommended: true,
            },
            { id: "reject", label: "Reject Document" },
            { id: "request", label: "Request Changes" },
          ],
        } satisfies ToolResultChoices),
        timestamp: Date.now(),
      },
    ];
  }

  if (lowerMessage.includes("report") || lowerMessage.includes("generate")) {
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

  return [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `I received your message: "${userMessage}". Try asking me to:\n\n• **Search** for something (shows grouped tool calls)\n• **Approve** or **review** a document (shows suggestions)\n• **Generate** a report (shows tool calls with text)`,
      timestamp: Date.now(),
    },
  ];
}

const toolDisplayNames = {
  search_database: "Search Database",
  filter_results: "Filter Results",
  sort_results: "Sort Results",
  validate_data: "Validate Data",
  check_permissions: "Check Permissions",
  fetch_data: "Fetch Data",
  generate_report: "Generate Report",
  format_output: "Format Output",
  send_notification: "Send Notification",
};

function AiChatDemo() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    setTimeout(() => {
      const responses = getMockResponse(content);
      setMessages((prev) => [...prev, ...responses]);
      setIsLoading(false);
    }, 1000);
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <AiChat
      messages={messages}
      isLoading={isLoading}
      onSendMessage={handleSendMessage}
      onStop={() => setIsLoading(false)}
      onClearChat={handleClear}
      title={t("ai_assistant")}
      placeholder="Try: 'search database' or 'approve document'"
      assistantName={t("assistant")}
      enableToolGrouping={true}
      toolDisplayNames={toolDisplayNames}
    />
  );
}

export function AiChatTemplate() {
  return <AiChatDemo />;
}
