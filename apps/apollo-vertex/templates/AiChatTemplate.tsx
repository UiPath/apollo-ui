"use client";

import { useChat } from "@tanstack/ai-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createAgentHubConnection } from "@/registry/ai-chat/adapters/agenthub/adapter";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import { choicesTool } from "@/registry/ai-chat/tools/choices";
import { tableTool } from "@/registry/ai-chat/tools/table";
import { barchartTool } from "@/registry/ai-chat/tools/barchart";
import {
  extractClientTools,
  extractDisplayTools,
  extractPrompts,
} from "@/registry/ai-chat/tools/tool-utils";
import { ShellAuthProvider } from "@/registry/shell/shell-auth-provider";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import { AiChatLoginGate, type OrgTenantInfo } from "./AiChatLoginGate";

const queryClient = new QueryClient();

const allTools = [choicesTool, tableTool, barchartTool];
const clientTools = extractClientTools(allTools);
const displayTools = extractDisplayTools(allTools);

const systemPrompt = `You are a helpful assistant. Always respond using markdown format.

${extractPrompts(allTools)}`;

function AiChatWithConnection({
  accessToken,
  orgTenant,
}: {
  accessToken: string;
  orgTenant: OrgTenantInfo;
}) {
  const { t } = useTranslation();

  const connection = useMemo(
    () =>
      createAgentHubConnection({
        baseUrl: `/api/agenthub/${orgTenant.orgName}/${orgTenant.tenantName}/agenthub_/llm/api`,
        model: { vendor: "openai", name: "gpt-4.1-mini-2025-04-14" },
        accessToken: () => accessToken,
        systemPrompt,
        tools: clientTools,
      }),
    [accessToken, orgTenant],
  );

  const { messages, sendMessage, isLoading, stop, clear, error } = useChat({
    connection,
    tools: clientTools,
  });

  return (
    <div className="h-[500px]">
      <AiChat
        messages={messages}
        isLoading={isLoading}
        onSendMessage={(text) => sendMessage(text)}
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
            displayTools={displayTools}
            onAction={(text) => sendMessage(text)}
          />
        ))}
      </AiChat>
    </div>
  );
}

export function AiChatTemplate() {
  return (
    <QueryClientProvider client={queryClient}>
      <ShellAuthProvider
        clientId="1119a927-10ab-4543-bd1a-ad6bfbbc27f4"
        scope="openid profile offline_access"
        baseUrl=""
        redirectPath="/auth_callback"
      >
        <LocaleProvider>
          <AiChatLoginGate>
            {({ accessToken, orgTenant }) => (
              <AiChatWithConnection
                key={orgTenant.tenantId}
                accessToken={accessToken}
                orgTenant={orgTenant}
              />
            )}
          </AiChatLoginGate>
        </LocaleProvider>
      </ShellAuthProvider>
    </QueryClientProvider>
  );
}
