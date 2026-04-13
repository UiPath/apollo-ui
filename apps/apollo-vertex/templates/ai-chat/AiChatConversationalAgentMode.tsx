"use client";

import { useLocalStorage } from "@mantine/hooks";
import { useChat } from "@tanstack/ai-react";
import { useQuery } from "@tanstack/react-query";
import { ConversationalAgent } from "@uipath/uipath-typescript/conversational-agent";
import type { UiPath } from "@uipath/uipath-typescript/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createConversationalAgentConnection } from "@/registry/ai-chat/adapters/conversational-agent/adapter";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import { AgentPicker } from "./AiChatAgentPicker";
import type { OrgTenantInfo } from "./AiChatLoginGate";
import { AICHAT_STORAGE_KEYS, createUiPathSdk } from "./ai-chat-example-utils";

interface ConversationalAgentChatInnerProps {
  sdk: UiPath;
  agentId: number;
  folderId: number;
  title: string;
  assistantName: string;
}

function ConversationalAgentChatInner({
  sdk,
  agentId,
  folderId,
  title,
  assistantName,
}: ConversationalAgentChatInnerProps) {
  const [connection] = useState(() =>
    createConversationalAgentConnection({ sdk, agentId, folderId }),
  );

  useEffect(() => {
    return () => {
      connection.dispose();
    };
  }, [connection]);

  const { messages, sendMessage, isLoading, stop, clear, reload, error } =
    useChat({
      connection,
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
      onRegenerate={reload}
      title={title}
      assistantName={assistantName}
      error={error ?? null}
    >
      {messages.map((message) => (
        <AiChatMessage key={message.id} message={message} />
      ))}
    </AiChat>
  );
}

interface ConversationalAgentChatProps {
  accessToken: string;
  orgTenant: OrgTenantInfo;
}

function parseAgentConfig(
  effectiveAgent: string | null,
): { agentId: number; folderId: number } | null {
  if (!effectiveAgent) return null;
  const [rawAgentId, rawFolderId] = effectiveAgent.split(":");
  const agentId = Number(rawAgentId);
  const folderId = Number(rawFolderId);
  if (Number.isNaN(agentId) || Number.isNaN(folderId)) return null;
  return { agentId, folderId };
}

export function ConversationalAgentChat({
  accessToken,
  orgTenant,
}: ConversationalAgentChatProps) {
  const { t } = useTranslation();
  const agentStorageKey = `${AICHAT_STORAGE_KEYS.AGENT}:${orgTenant.tenantId}`;

  const [selectedAgent, setSelectedAgent] = useLocalStorage<string | null>({
    key: agentStorageKey,
    defaultValue: null,
  });

  const sdk = createUiPathSdk(accessToken, orgTenant);

  const {
    data: agents = [],
    isLoading: agentsLoading,
    error: agentsError,
  } = useQuery({
    queryKey: [
      "conversational-agents",
      orgTenant.orgName,
      orgTenant.tenantName,
    ],
    queryFn: () => new ConversationalAgent(sdk).getAll(),
  });

  const effectiveAgent =
    agents.length === 0
      ? null
      : selectedAgent &&
          agents.some((a) => `${a.id}:${a.folderId}` === selectedAgent)
        ? selectedAgent
        : `${agents[0].id}:${agents[0].folderId}`;

  const selectedAgentConfig = parseAgentConfig(effectiveAgent);

  if (!selectedAgentConfig) {
    return (
      <div className="flex h-full items-center justify-center">
        <AgentPicker
          agents={agents}
          isLoading={agentsLoading}
          error={agentsError}
          selectedAgentId={effectiveAgent}
          onSelect={setSelectedAgent}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="self-end">
        <AgentPicker
          agents={agents}
          isLoading={agentsLoading}
          error={agentsError}
          selectedAgentId={effectiveAgent}
          onSelect={setSelectedAgent}
        />
      </div>
      <div className="min-h-0 flex-1">
        <ConversationalAgentChatInner
          key={effectiveAgent}
          sdk={sdk}
          agentId={selectedAgentConfig.agentId}
          folderId={selectedAgentConfig.folderId}
          title="Autopilot"
          assistantName={t("assistant")}
        />
      </div>
    </div>
  );
}
