"use client";

import type { MessagePart, UIMessage } from "@tanstack/ai-client";
import { AiChatThinking } from "@/registry/ai-chat/components/ai-chat-thinking";
import { useConversation } from "./conversation-context";
import {
  MatchCarousel,
  type MatchesOutput,
  ReviewCta,
  WorkbenchCta,
} from "./MatchCarousel";
import { RequestEnvelope } from "./RequestEnvelope";
import { ServiceBridge } from "./ServiceBridge";

interface GuidedBuyProps {
  /** See-all → catalog (plays Buy's exit transition). */
  onSeeAll: () => void;
  /** Configure with agent → the configurator (contract path). */
  onConfigure: () => void;
}

type ToolPart = MessagePart & { id: string; name: string; output: unknown };

/**
 * The guided Buy surface — what renders beneath the header anchor (BuyScaffold)
 * once a request is made. Shows the active step's structured surface (envelope /
 * service Bridge / results) for the latest agent turn only — no transcript. The
 * ask affordance lives in the global Autopilot FAB, not here.
 */
export function GuidedBuy({ onSeeAll, onConfigure }: GuidedBuyProps) {
  const { messages, status } = useConversation();

  // The surface tracks the latest agent turn only — no transcript.
  let lastAssistant: UIMessage | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistant = messages[i];
      break;
    }
  }
  const toolParts = (lastAssistant?.parts ?? []).filter(
    (p): p is ToolPart => p.type === "tool-call",
  );
  const working = status === "submitted" || status === "streaming";

  const renderSurface = (part: ToolPart) => {
    switch (part.name) {
      case "presentEnvelope":
        return <RequestEnvelope />;
      case "presentServiceBridge":
        return <ServiceBridge onConfigure={onConfigure} />;
      case "presentMatches":
        return (
          <MatchCarousel
            output={part.output as MatchesOutput}
            onSeeAll={onSeeAll}
          />
        );
      case "reviewCta":
        return <ReviewCta />;
      case "workbenchCta":
        return <WorkbenchCta />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* The structured surface, presented directly (no bubble chrome). */}
      {toolParts.length > 0 ? (
        toolParts.map((part) => <div key={part.id}>{renderSurface(part)}</div>)
      ) : working ? (
        <div className="flex justify-center py-6">
          <AiChatThinking size={36} />
        </div>
      ) : null}
    </div>
  );
}
