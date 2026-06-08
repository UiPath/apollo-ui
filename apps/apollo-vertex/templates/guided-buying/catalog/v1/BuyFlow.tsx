"use client";

import { useEffect, useRef } from "react";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { AutopilotGradientIcon } from "@/registry/ai-chat/components/icons/autopilot-gradient";
import { useConversation } from "./conversation-context";
import { MatchCarousel, ReviewCta } from "./MatchCarousel";
import { RequestEnvelope } from "./RequestEnvelope";

// The catalog (demo) path; the other two preview the quote/contract forks.
const CATALOG_STARTER = "2 ThinkPad X1 laptops for our new designers.";
const STARTERS = [
  CATALOG_STARTER,
  "5 standing desks for the Berlin office.",
  "Add 12 mobile lines for the Denver team.",
];

/**
 * The `/buy` front door. A centered chat column within the Buy section (nav
 * stays visible — no full-screen takeover). Autopilot delivers the answer in
 * the thread: a streamed restatement, then a carousel of matches. The chat
 * starts fresh each time the user lands here.
 */
export function BuyFlow() {
  const {
    messages,
    status,
    sendCatalogRequest,
    sendOffCatalog,
    stop,
    startFresh,
  } = useConversation();

  // Reset to the Intake empty state whenever the user (re)enters Buy.
  const didReset = useRef(false);
  useEffect(() => {
    if (didReset.current) return;
    didReset.current = true;
    startFresh();
  }, [startFresh]);

  const handleSuggestion = (suggestion: string) => {
    if (suggestion === CATALOG_STARTER) sendCatalogRequest(suggestion);
    else sendOffCatalog(suggestion);
  };

  return (
    <div className="h-full">
      <AiChat
        messages={messages}
        status={status}
        onSendMessage={sendCatalogRequest}
        onStop={stop}
        renderToolPart={(part) =>
          part.name === "presentEnvelope" ? (
            <RequestEnvelope />
          ) : part.name === "presentMatches" ? (
            <MatchCarousel output={part.output} />
          ) : part.name === "reviewCta" ? (
            <ReviewCta />
          ) : null
        }
        suggestions={STARTERS}
        onSuggestionClick={handleSuggestion}
        placeholder="Describe what you need…"
        // Header is absent on the empty hero; it appears once it's a conversation.
        header={
          messages.length > 0 ? (
            <div className="flex items-center gap-1.5 px-4 py-3">
              <AutopilotGradientIcon size={21} aria-hidden="true" />
              <span className="bg-clip-text pt-0.5 text-sm font-bold tracking-tight text-transparent [background-image:var(--ai-chat-brand-gradient)]">
                Autopilot
              </span>
            </div>
          ) : null
        }
        emptyState={
          <div className="flex flex-col items-center gap-3 text-center">
            <span
              className="flex size-12 items-center justify-center rounded-full text-white"
              style={{ background: "var(--ai-gradient-strong)" }}
            >
              <AutopilotIcon size={26} aria-hidden />
            </span>
            <h1 className="text-2xl font-semibold text-foreground">
              What do you need?
            </h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Tell Autopilot what to buy — it sources, prices, and routes the
              request.
            </p>
          </div>
        }
      />
    </div>
  );
}
