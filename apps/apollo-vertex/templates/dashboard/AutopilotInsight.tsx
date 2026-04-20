"use client";

import { useChat } from "@tanstack/ai-react";
import { LogIn, MoreHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createAgentHubConnection } from "@/registry/ai-chat/adapters/agenthub/adapter";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/alert-dialog/alert-dialog";
import { GLASS_CLASSES } from "@/registry/card/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/dropdown-menu/dropdown-menu";
import type { OrgTenantInfo } from "@/templates/ai-chat/AiChatLoginGate";
import { useDashboardChat } from "./DashboardChatProvider";
import { createDemoConnection } from "./demo-connection";

interface AutopilotInsightProps {
  onClose: () => void;
  sourceCardTitle: string;
  initialMessage?: string;
}

interface AutopilotChatProps {
  accessToken?: string;
  orgTenant?: OrgTenantInfo;
  sourceCardTitle: string;
  initialMessage?: string;
  demo?: boolean;
  onClose: () => void;
}

function AutopilotChat({
  accessToken,
  orgTenant,
  sourceCardTitle,
  initialMessage,
  demo = false,
  onClose,
}: AutopilotChatProps) {
  // Keep access token ref in sync on every render so the connection closure
  // always reads the latest value without recreating the connection.
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  // Stable connection — created once per mount via useState lazy init.
  // Re-creating the connection object on every render causes useChat's
  // updateOptions() to detect a changed connection and call
  // cancelInFlightStream(), aborting any active stream mid-flight.
  const [connection] = useState(() =>
    demo
      ? createDemoConnection(sourceCardTitle)
      : createAgentHubConnection({
          baseUrl: `/api/agenthub/${orgTenant!.orgName}/${orgTenant!.tenantName}/agenthub_/llm/api`,
          model: { vendor: "openai", name: "gpt-4.1-mini-2025-04-14" },
          accessToken: () => accessTokenRef.current!,
          systemPrompt: `You are an AI assistant analyzing the "${sourceCardTitle}" insight card in an operational dashboard. Provide concise, data-driven analysis and actionable recommendations. Always respond using markdown format.`,
        }),
  );

  const {
    messages,
    sendMessage,
    reload,
    isLoading,
    stop,
    clear,
    setMessages,
    error,
  } = useChat({
    connection,
  });

  const [conversationCopied, setConversationCopied] = useState(false);

  // True while the component is waiting for the initial auto-send to fire.
  // Hides the generic "What are we tackling today?" empty state during this window
  // so users never see irrelevant placeholder text in the autopilot panel.
  const [preInitializing, setPreInitializing] = useState(!!initialMessage);

  // Auto-send the initial message once on mount (component remounts per unique prompt).
  // setTimeout defers the send to a macrotask so it runs AFTER React 18 StrictMode's
  // double-invoke cleanup cycle completes — preventing a null.signal race in useChat.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!initialMessage) return;
    const id = setTimeout(() => {
      void sendMessage(initialMessage);
      setPreInitializing(false);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const handleCopyConversation = async () => {
    const text = messages
      .map((m) => {
        const content = m.parts
          .filter(
            (p): p is { type: "text"; content: string } => p.type === "text",
          )
          .map((p) => p.content)
          .join("");
        if (!content) return null;
        const label = m.role === "user" ? "You" : "Autopilot";
        return `${label}: ${content}`;
      })
      .filter(Boolean)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setConversationCopied(true);
    setTimeout(() => setConversationCopied(false), 2000);
  };

  const handleEditMessage = (messageId: string, content: string) => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    // Truncate to (and including) the edited user message, replacing its content.
    // Subsequent assistant messages are discarded so reload() regenerates them.
    const updated = messages
      .slice(0, idx + 1)
      .map((m, i) =>
        i === idx ? { ...m, parts: [{ type: "text" as const, content }] } : m,
      );
    setMessages(updated);
    void reload();
  };

  const hasMessages = messages.length > 0;

  return (
    <AiChat
      messages={messages}
      isLoading={isLoading}
      onSendMessage={(text) => {
        void sendMessage(text);
      }}
      onStop={stop}
      onClearChat={clear}
      onRegenerate={() => void reload()}
      onEditMessage={handleEditMessage}
      assistantName="Autopilot"
      enableTextSelection
      showClearButton={hasMessages}
      error={error ?? null}
      // Hide the generic empty-state text while the auto-send is pending.
      // The component mounts with messages=[] for ~1 frame before sendMessage fires.
      emptyState={preInitializing ? <></> : undefined}
      renderHeader={
        <div className="flex items-start justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <img
              src="/Autopilot_dark.svg"
              alt="Autopilot"
              className="size-5 block dark:hidden"
            />
            <img
              src="/Autopilot_light.svg"
              alt="Autopilot"
              className="size-5 hidden dark:block"
            />
            <div>
              <p className="text-sm font-bold tracking-tight">
                Autopilot Insight
              </p>
              <p className="text-xs text-muted-foreground">
                Analyzing {sourceCardTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasMessages && (
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        void handleCopyConversation();
                      }}
                    >
                      {conversationCopied ? "Copied!" : "Copy conversation"}
                    </DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem>New conversation</DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Start a new conversation?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear all messages and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clear}>
                      New conversation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <button
              type="button"
              onClick={onClose}
              className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      }
    >
      {messages.map((msg) => (
        <AiChatMessage key={msg.id} message={msg} />
      ))}
    </AiChat>
  );
}

export function AutopilotInsight({
  onClose,
  sourceCardTitle,
  initialMessage,
}: AutopilotInsightProps) {
  const { accessToken, orgTenant, isLoading, login, demo } = useDashboardChat();

  const isReady = demo || (!!accessToken && !!orgTenant);

  return (
    <div
      className={cn(
        GLASS_CLASSES,
        "!bg-white/90 dark:!bg-card h-full overflow-hidden flex flex-col gap-0",
      )}
    >
      {/* Header: shown only for loading/not-ready states.
          AutopilotChat renders its own header via renderHeader when ready. */}
      {!isReady && (
        <div className="flex items-start justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <img
              src="/Autopilot_dark.svg"
              alt="Autopilot"
              className="size-5 block dark:hidden"
            />
            <img
              src="/Autopilot_light.svg"
              alt="Autopilot"
              className="size-5 hidden dark:block"
            />
            <div>
              <p className="text-sm font-bold tracking-tight">
                Autopilot Insight
              </p>
              <p className="text-xs text-muted-foreground">
                Analyzing {sourceCardTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Body */}
      <div
        className={cn(
          "flex-1 min-h-0",
          !isReady && "px-3 pb-3",
          "[&_[data-slot='ai-chat']]:border-0",
          "[&_[data-slot='ai-chat']]:rounded-none",
          "[&_[data-slot='ai-chat']]:bg-transparent",
        )}
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Signing in...
          </div>
        )}

        {!isLoading && !isReady && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-muted-foreground text-center">
              Sign in to use Autopilot
            </p>
            <Button size="sm" onClick={login}>
              <LogIn className="size-4 mr-1" />
              Sign in
            </Button>
          </div>
        )}

        {!isLoading && isReady && (
          <AutopilotChat
            key={`${sourceCardTitle}::${initialMessage ?? ""}`}
            accessToken={accessToken ?? undefined}
            orgTenant={orgTenant ?? undefined}
            sourceCardTitle={sourceCardTitle}
            initialMessage={initialMessage}
            demo={demo}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
