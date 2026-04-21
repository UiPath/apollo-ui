"use client";

import { useChat } from "@tanstack/ai-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Entities } from "@uipath/uipath-typescript/entities";
import { useTranslation } from "react-i18next";
import { createAgentHubConnection } from "@/registry/ai-chat/adapters/agenthub/adapter";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import type { Entity } from "@/registry/ai-chat/tools/data-fabric/shared";
import {
  CHOICES_TOOL_PROMPT,
  presentChoicesClient,
  renderChoices,
} from "@/registry/ai-chat/tools/choices";
import { createDataFabricTableTool } from "@/registry/ai-chat/tools/data-fabric-table";
import { DataFabricGate } from "./AiChatDataFabricGate";
import type { OrgTenantInfo } from "./AiChatLoginGate";
import { createUiPathSdk } from "./ai-chat-example-utils";

const queryClient = new QueryClient();

interface AgentHubChatProps {
  accessToken: string;
  orgTenant: OrgTenantInfo;
}

interface AgentHubChatInnerProps {
  accessToken: string;
  orgTenant: OrgTenantInfo;
  entities: Record<string, Entity>;
}

function AgentHubChatInner({
  accessToken,
  orgTenant,
  entities,
}: AgentHubChatInnerProps) {
  const { t } = useTranslation();

  const dataFabricBaseUrl = `/api/agenthub/${orgTenant.orgName}/${orgTenant.tenantName}/datafabric_/api`;

  const tableTool = createDataFabricTableTool({
    entities,
    accessToken,
    dataFabricBaseUrl,
  });

  const clientTools = [presentChoicesClient, tableTool.clientTool];

  const systemPrompt = [
    "You are a helpful assistant. Always respond using markdown format.",
    CHOICES_TOOL_PROMPT,
    tableTool.toolPrompt,
  ].join("\n\n");

  const connection = createAgentHubConnection({
    baseUrl: `/api/agenthub/${orgTenant.orgName}/${orgTenant.tenantName}/agenthub_/llm/api`,
    model: { vendor: "openai", name: "gpt-4.1-mini-2025-04-14" },
    accessToken: () => accessToken,
    systemPrompt,
    tools: clientTools,
  });

  const { messages, sendMessage, isLoading, stop, clear, error } = useChat({
    connection,
    tools: clientTools,
  });

  const toolsRenderer = {
    data_fabric_table: ({ output }: { output: unknown }) =>
      tableTool.renderTable(output),
    presentChoices: ({ output }: { output: unknown }) =>
      renderChoices(output, {
        onAction: (text) => {
          void sendMessage(text);
        },
      }),
  };

  return (
    <AiChat
      messages={messages}
      isLoading={isLoading}
      onSendMessage={(text) => {
        void sendMessage(text);
      }}
      onStop={stop}
      onClearChat={clear}
      title={t("ai_assistant")}
      assistantName={t("assistant")}
      error={error ?? null}
    >
      {messages.map((message) => (
        <AiChatMessage
          key={message.id}
          message={message}
          assistantName={t("assistant")}
          toolsRenderer={toolsRenderer}
        />
      ))}
    </AiChat>
  );
}

export function AgentHubChat({ accessToken, orgTenant }: AgentHubChatProps) {
  const sdk = createUiPathSdk(accessToken, orgTenant);
  const entitiesService = new Entities(sdk);

  return (
    <QueryClientProvider client={queryClient}>
      <DataFabricGate entities={entitiesService}>
        {({ entities }) => (
          <AgentHubChatInner
            accessToken={accessToken}
            orgTenant={orgTenant}
            entities={entities}
          />
        )}
      </DataFabricGate>
    </QueryClientProvider>
  );
}
