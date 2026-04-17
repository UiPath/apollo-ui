"use client";

import { useChat } from "@tanstack/ai-react";
import { useTranslation } from "react-i18next";
import { createAgentHubConnection } from "@/registry/ai-chat/adapters/agenthub/adapter";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatEmptyState } from "@/registry/ai-chat/components/ai-chat-empty-state";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import {
  CHOICES_TOOL_PROMPT,
  choicesTools,
} from "@/registry/ai-chat/examples/choices-tool";
import {
  FLOW_TOOL_PROMPT,
  flowTool,
} from "@/registry/ai-chat/examples/flow-tool";
import type { OrgTenantInfo } from "./AiChatLoginGate";

const allTools = [...choicesTools, ...flowTool];

const systemPrompt = `You are a helpful assistant. Always respond using markdown format.

${CHOICES_TOOL_PROMPT}

${FLOW_TOOL_PROMPT}`;

interface AgentHubChatProps {
  accessToken: string;
  orgTenant: OrgTenantInfo;
}

export function AgentHubChat({ accessToken, orgTenant }: AgentHubChatProps) {
  const { t } = useTranslation();

  const connection = createAgentHubConnection({
    baseUrl: `/api/agenthub/${orgTenant.orgName}/${orgTenant.tenantName}/agenthub_/llm/api`,
    model: { vendor: "openai", name: "gpt-4.1-mini-2025-04-14" },
    accessToken: () => accessToken,
    systemPrompt,
    tools: allTools,
  });

  const { messages, sendMessage, isLoading, stop, clear, reload, error } =
    useChat({
      connection,
      tools: allTools,
    });

  return (
    <AiChat
      messages={messages}
      isLoading={isLoading}
      onSendMessage={(text) => {
        void sendMessage(text);
      }}
      onStop={stop}
      onClearChat={clear}
      onRegenerate={() => {
        void reload();
      }}
      onEditMessage={(_id, content) => {
        void sendMessage(content);
      }}
      title="Autopilot"
      assistantName={t("assistant")}
      enableTextSelection
      error={error ?? null}
      emptyState={<AiChatEmptyState title="What are we tackling today?" />}
      suggestions={[
        "Summarize a PDF",
        "Create an executive brief",
        "Draft a follow-up for my last meeting",
      ]}
    >
      {messages.map((message) => (
        <AiChatMessage key={message.id} message={message} />
      ))}
    </AiChat>
  );
}
