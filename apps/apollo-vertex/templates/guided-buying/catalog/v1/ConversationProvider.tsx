"use client";

import type {
  ChatClientState,
  MessagePart,
  UIMessage,
} from "@tanstack/ai-client";
import { type ReactNode, useRef, useState } from "react";
import {
  type BuyPhase,
  ConversationContext,
  type ConversationContextValue,
  type RequestDetails,
} from "./conversation-context";
import {
  APPROVAL_LIMIT,
  CATALOG_ITEMS,
  effectivePrice,
  formatPrice,
  RECOMMENDATION,
  SAMPLE_REQUEST,
} from "./data";
import type { CatalogItem } from "./types";

// The Bridge lead line — streams in word-by-word above the inferred envelope.
const INTRO =
  "Here's what I inferred from your team's past requests and your profile. Edit anything that's off.";

// Sourcing summary — the products layer, shown when the user continues to
// selection (kept separate from the request envelope).
const SOURCING_SUMMARY =
  "Found 12 catalog matches · EPP pricing · in-stock only";

// Direct /catalog entry seeds this resting summary in the rail (no Bridge).
const RESOLVED_SUMMARY = `Here's what I'm on: ${SAMPLE_REQUEST.summary}\n\n${SAMPLE_REQUEST.agentNote}`;

// Tool-call part names rendered inline in the thread.
const ENVELOPE_TOOL = "presentEnvelope";
const MATCHES_TOOL = "presentMatches";
const REVIEW_TOOL = "reviewCta";
const WORKBENCH_TOOL = "workbenchCta";
const SERVICE_BRIDGE_TOOL = "presentServiceBridge";
const SOURCING_BRIDGE_TOOL = "presentSourcingBridge";

// Two laptop alternatives behind the pick (the "2 alternatives" move).
const ALT_IDS = CATALOG_ITEMS.filter(
  (item) => item.category === "Laptops" && item.id !== RECOMMENDATION.itemId,
)
  .slice(0, RECOMMENDATION.alternatives)
  .map((item) => item.id);

const START_MS = 350;
const WORD_MS = 42;
const SKELETON_MS = 900;

function textMessage(
  id: string,
  role: "user" | "assistant",
  content: string,
): UIMessage {
  return { id, role, parts: [{ type: "text", content }] };
}

// A mocked tool-call part — the gate is `output != null`, so renderToolPart
// runs and renders our rich content inline in the message bubble.
function toolPart(id: string, name: string, output: unknown): MessagePart {
  return {
    type: "tool-call",
    id,
    name,
    arguments: "{}",
    state: "input-complete",
    output,
  };
}

/**
 * Scripted conversation shared across Intake (Buy hero), the in-chat Bridge, and
 * the docked rail — one thread in three framings. Mocked: no live LLM/AgentHub.
 */
export function ConversationProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [status, setStatus] = useState<ChatClientState>("ready");
  const [phase, setPhase] = useState<BuyPhase>("intake");
  const [requestText, setRequestText] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(
    null,
  );
  const [hasResolved, setHasResolved] = useState(false);
  const [routedRequestId, setRoutedRequestId] = useState<string | null>(null);

  const idRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cartConfirmedRef = useRef(false);
  const selectionStartedRef = useRef(false);

  const nextId = () => {
    idRef.current += 1;
    return `m${idRef.current}`;
  };
  const clearTimers = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  };

  const setAssistantParts = (id: string, parts: MessagePart[]) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, parts } : m)));
  };

  const matchesPart = (assistantId: string, loading: boolean): MessagePart =>
    toolPart(`${assistantId}-matches`, MATCHES_TOOL, {
      leadId: RECOMMENDATION.itemId,
      altIds: ALT_IDS,
      totalCount: CATALOG_ITEMS.length,
      loading,
    });

  const sendCatalogRequest = (text: string) => {
    clearTimers();
    setPhase("bridge");
    setRequestText(text);
    selectionStartedRef.current = false;
    const userMsg = textMessage(nextId(), "user", text);
    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      textMessage(assistantId, "assistant", ""),
    ]);
    setStatus("submitted");

    // Stream the intro line word-by-word for a seamless typing feel.
    const words = INTRO.split(" ");
    words.forEach((_, i) => {
      timers.current.push(
        setTimeout(
          () => {
            setStatus("streaming");
            setAssistantParts(assistantId, [
              { type: "text", content: words.slice(0, i + 1).join(" ") },
            ]);
          },
          START_MS + i * WORD_MS,
        ),
      );
    });

    // Intro settles, then the inferred request envelope lands in the same turn
    // (the envelope self-animates its own staggered field reveal).
    const streamEnd = START_MS + words.length * WORD_MS;
    timers.current.push(
      setTimeout(() => {
        setAssistantParts(assistantId, [
          { type: "text", content: INTRO },
          toolPart(`${assistantId}-envelope`, ENVELOPE_TOOL, {
            kind: "envelope",
          }),
        ]);
        setStatus("ready");
        setHasResolved(true);
      }, streamEnd + 150),
    );
  };

  const continueToSelection = () => {
    if (selectionStartedRef.current) return;
    selectionStartedRef.current = true;
    clearTimers();
    setPhase("selection");
    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        parts: [
          { type: "text", content: SOURCING_SUMMARY },
          matchesPart(assistantId, true),
        ],
      },
    ]);
    // Brief skeleton, then the real cards reveal.
    timers.current.push(
      setTimeout(() => {
        setAssistantParts(assistantId, [
          { type: "text", content: SOURCING_SUMMARY },
          matchesPart(assistantId, false),
        ]);
      }, SKELETON_MS),
    );
  };

  const resolveDefault = () => {
    clearTimers();
    setPhase("selection");
    setMessages([
      textMessage(nextId(), "user", SAMPLE_REQUEST.summary),
      textMessage(nextId(), "assistant", RESOLVED_SUMMARY),
    ]);
    setStatus("ready");
    setHasResolved(true);
  };

  const sendOffCatalog = (text: string, requestId: string) => {
    clearTimers();
    setPhase("offcatalog");
    setRequestText(text);
    setRoutedRequestId(requestId);
    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      textMessage(nextId(), "user", text),
      {
        id: assistantId,
        role: "assistant",
        parts: [
          {
            type: "text",
            content:
              "This one needs a buyer — I've sourced what I can and routed it to procurement. They'll review it in the Workbench and you'll get an update here once they've decided.",
          },
          toolPart(`${assistantId}-wb`, WORKBENCH_TOOL, { requestId }),
        ],
      },
    ]);
    setStatus("ready");
    // Stays in Intake: off-catalog doesn't resolve into the catalog workspace.
  };

  const clearRoutedRequest = () => setRoutedRequestId(null);
  const routeToWorkbench = (id: string) => setRoutedRequestId(id);

  // Contract fork: a short in-chat service Bridge (restate + provenance +
  // routing). Its CTA opens the configurator. Doesn't resolve into the catalog.
  const sendServiceRequest = (text: string) => {
    clearTimers();
    setPhase("service");
    setRequestText(text);
    const userMsg = textMessage(nextId(), "user", text);
    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      textMessage(assistantId, "assistant", ""),
    ]);
    setStatus("submitted");
    timers.current.push(
      setTimeout(() => {
        setAssistantParts(assistantId, [
          toolPart(`${assistantId}-svc`, SERVICE_BRIDGE_TOOL, {
            kind: "service",
          }),
        ]);
        setStatus("ready");
      }, 600),
    );
  };

  // Sourcing fork: a services Bridge (restate + provenance + RFQ routing line).
  // Its CTA routes the RFQ to procurement; the rich beat is the buyer's Workbench.
  const sendSourcingRequest = (text: string) => {
    clearTimers();
    setPhase("sourcing");
    setRequestText(text);
    const userMsg = textMessage(nextId(), "user", text);
    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      textMessage(assistantId, "assistant", ""),
    ]);
    setStatus("submitted");
    timers.current.push(
      setTimeout(() => {
        setAssistantParts(assistantId, [
          toolPart(`${assistantId}-src`, SOURCING_BRIDGE_TOOL, {
            kind: "sourcing",
          }),
        ]);
        setStatus("ready");
      }, 600),
    );
  };

  const addNote = (text: string) => {
    setMessages((prev) => [...prev, textMessage(nextId(), "assistant", text)]);
  };

  const confirmAddToCart = (item: CatalogItem, quantity: number) => {
    if (cartConfirmedRef.current) return;
    cartConfirmedRef.current = true;
    // Short product name (drop the vendor prefix) + amount + limit status — the
    // confirmation pre-answers the approval question before Review.
    const shortName = item.name.replace(/^Lenovo\s+/, "");
    const amount = quantity * effectivePrice(item);
    const id = nextId();
    setMessages((prev) => [
      ...prev,
      {
        id,
        role: "assistant",
        parts: [
          {
            type: "text",
            content: `${quantity} ${shortName}${quantity > 1 ? "s" : ""} added — ${formatPrice(
              amount,
              item.currency,
            )}, within your ${formatPrice(APPROVAL_LIMIT, item.currency)} limit. Ready to review?`,
          },
          toolPart(`${id}-review`, REVIEW_TOOL, { ready: true }),
        ],
      },
    ]);
  };

  const startFresh = () => {
    clearTimers();
    cartConfirmedRef.current = false;
    selectionStartedRef.current = false;
    setMessages([]);
    setStatus("ready");
    setPhase("intake");
    setRequestText(null);
    setRequestDetails(null);
    setHasResolved(false);
    setRoutedRequestId(null);
  };

  // Step back one screen. From Selection, drop the matches turn to reveal the
  // Bridge again; from the first step after Intake, fall back to the hero.
  const stepBack = () => {
    if (phase === "selection") {
      clearTimers();
      selectionStartedRef.current = false;
      cartConfirmedRef.current = false;
      setMessages((prev) => prev.slice(0, -1));
      setStatus("ready");
      setPhase("bridge");
      return;
    }
    startFresh();
  };

  const stop = () => {
    clearTimers();
    setStatus("ready");
  };

  const value: ConversationContextValue = {
    messages,
    status,
    phase,
    requestText,
    requestDetails,
    setRequestDetails,
    hasResolved,
    sendCatalogRequest,
    continueToSelection,
    resolveDefault,
    sendOffCatalog,
    sendServiceRequest,
    sendSourcingRequest,
    routedRequestId,
    routeToWorkbench,
    clearRoutedRequest,
    addNote,
    confirmAddToCart,
    startFresh,
    stepBack,
    stop,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}
