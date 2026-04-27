"use client";

import { clientTools } from "@tanstack/ai-client";
import { useChat } from "@tanstack/ai-react";
import { Entities } from "@uipath/uipath-typescript/entities";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { createAgentHubConnection } from "@/registry/ai-chat/adapters/agenthub/adapter";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import {
  CHOICES_TOOL_PROMPT,
  presentChoicesClient,
  renderChoices,
} from "@/registry/ai-chat/tools/choices";
import type { Entity } from "@/registry/ai-chat/tools/data-fabric/shared";
import {
  createDataFabricDistributionTool,
  dataFabricDistributionClient,
} from "@/registry/ai-chat/tools/data-fabric-distribution";
import {
  createDataFabricTableTool,
  dataFabricTableClient,
} from "@/registry/ai-chat/tools/data-fabric-table";
import { DataFabricGate } from "./AiChatDataFabricGate";
import type { OrgTenantInfo } from "./AiChatLoginGate";
import { createUiPathSdk } from "./ai-chat-example-utils";

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

  const dataFabricBaseUrl = `/api/datafabric/${orgTenant.orgName}/${orgTenant.tenantName}/datafabric_/api`;

  const tableTool = createDataFabricTableTool({
    entities,
    accessToken,
    dataFabricBaseUrl,
  });

  const distributionTool = createDataFabricDistributionTool({
    entities,
    accessToken,
    dataFabricBaseUrl,
  });

  const tools = clientTools(
    presentChoicesClient,
    dataFabricTableClient,
    dataFabricDistributionClient,
  );

  const systemPrompt = [
    "You are a helpful assistant. Always respond using markdown format.",
    CHOICES_TOOL_PROMPT,
    tableTool.toolPrompt,
    distributionTool.toolPrompt,
  ].join("\n\n");

  const connection = createAgentHubConnection({
    baseUrl: `/api/agenthub/${orgTenant.orgName}/${orgTenant.tenantName}/agenthub_/llm/api`,
    model: { vendor: "openai", name: "gpt-4.1-mini-2025-04-14" },
    accessToken: () => accessToken,
    systemPrompt,
    tools,
  });

  const { messages, sendMessage, isLoading, stop, clear, error } = useChat({
    connection,
    tools,
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
      title={t("ai_assistant")}
      assistantName={t("assistant")}
      error={error ?? null}
    >
      {messages.map((message) => (
        <AiChatMessage
          key={message.id}
          message={message}
          assistantName={t("assistant")}
        >
          {message.parts.map((part) => {
            if (part.type !== "tool-call" || !part.output) return null;

            if (part.name === "data_fabric_table") {
              return (
                <Suspense key={part.id}>
                  {tableTool.renderTable(part.output, part.id)}
                </Suspense>
              );
            }

            if (part.name === "data_fabric_distribution") {
              return (
                <Suspense key={part.id}>
                  {distributionTool.renderDistribution(part.output, part.id)}
                </Suspense>
              );
            }

            if (part.name === "presentChoices") {
              return (
                <div key={part.id}>
                  {renderChoices(part.output, {
                    onAction: (text) => {
                      void sendMessage(text);
                    },
                  })}
                </div>
              );
            }

            return null;
          })}
        </AiChatMessage>
      ))}
    </AiChat>
  );
}

export function AgentHubChat({ accessToken, orgTenant }: AgentHubChatProps) {
  const sdk = createUiPathSdk(accessToken, orgTenant);
  const entitiesService = new Entities(sdk);

  return (
    <DataFabricGate entities={entitiesService} tenantId={orgTenant.tenantId}>
      {({ entities }) => (
        <AgentHubChatInner
          accessToken={accessToken}
          orgTenant={orgTenant}
          entities={entities}
        />
      )}
    </DataFabricGate>
  );
}
