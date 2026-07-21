"use client";

import { useLocalStorage } from "@mantine/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Label } from "@/registry/label/label";
import { RadioGroup, RadioGroupItem } from "@/registry/radio-group/radio-group";
import { ShellAuthProvider } from "@/registry/shell/shell-auth-provider";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import { AgentHubChat } from "./ai-chat/AiChatAgentHubMode";
import { ConversationalAgentChat } from "./ai-chat/AiChatConversationalAgentMode";
import { AiChatLoginGate, type OrgTenantInfo } from "./ai-chat/AiChatLoginGate";
import {
  AICHAT_CLIENT_ID,
  AICHAT_DIRECT_BASE_URL,
  AICHAT_REDIRECT_PATH,
  AICHAT_SCOPE,
  AICHAT_STORAGE_KEYS,
  type ChatMode,
} from "./ai-chat/ai-chat-example-utils";

const isChatMode = (v: string): v is ChatMode =>
  v === "agenthub" || v === "conversational-agent";

const queryClient = new QueryClient();

function AiChatWithConnection({
  accessToken,
  orgTenant,
}: {
  accessToken: string;
  orgTenant: OrgTenantInfo;
}) {
  const [mode, setMode] = useLocalStorage<ChatMode>({
    key: AICHAT_STORAGE_KEYS.MODE,
    defaultValue: "agenthub",
  });

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center justify-end gap-4 pt-2">
        <RadioGroup
          value={mode}
          onValueChange={(v) => {
            if (isChatMode(v)) setMode(v);
          }}
          className="flex flex-row gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="agenthub" id="mode-agenthub" />
            <Label htmlFor="mode-agenthub" className="cursor-pointer">
              AgentHub
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="conversational-agent"
              id="mode-conversational-agent"
            />
            <Label
              htmlFor="mode-conversational-agent"
              className="cursor-pointer"
            >
              Conversational Agent
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex-1 min-h-0">
        {mode === "agenthub" ? (
          <AgentHubChat accessToken={accessToken} orgTenant={orgTenant} />
        ) : (
          <ConversationalAgentChat
            accessToken={accessToken}
            orgTenant={orgTenant}
          />
        )}
      </div>
    </div>
  );
}

export function AiChatTemplate() {
  return (
    <div className="h-[70vh] min-h-[500px] max-h-[900px] flex w-full flex-col">
      <QueryClientProvider client={queryClient}>
        <ShellAuthProvider
          clientId={AICHAT_CLIENT_ID}
          scope={AICHAT_SCOPE}
          baseUrl={AICHAT_DIRECT_BASE_URL}
          redirectPath={AICHAT_REDIRECT_PATH}
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
    </div>
  );
}
