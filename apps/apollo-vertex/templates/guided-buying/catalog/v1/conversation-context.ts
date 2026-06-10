"use client";

import type { ChatClientState, UIMessage } from "@tanstack/ai-client";
import { createContext, useContext } from "react";
import type { CatalogItem } from "./types";

/** Which Buy screen is active — drives the constant header anchor + back. */
export type BuyPhase =
  | "intake"
  | "bridge"
  | "selection"
  | "service"
  | "offcatalog";

/** What the Bridge confirmed — carried to Review so its routing matches. */
export interface RequestDetails {
  /** Approver the request routes to (e.g. "Alex Chen · Design Director"). */
  approver: string;
  /** Cost center (e.g. "Design Operations · CC-4421"). */
  costCenter: string;
}

export interface ConversationContextValue {
  messages: UIMessage[];
  status: ChatClientState;
  /** The active Buy step (header anchor + back navigation). */
  phase: BuyPhase;
  /** What the user prompted (free text or a starter chip) — shown on the Bridge. */
  requestText: string | null;
  /** The Bridge-confirmed routing/cost-center (null until a Bridge resolves). */
  requestDetails: RequestDetails | null;
  /** Record what the Bridge confirmed (called when continuing to selection). */
  setRequestDetails: (details: RequestDetails) => void;
  /** True once the first request has resolved — the workspace then exists. */
  hasResolved: boolean;
  /** Run the scripted Bridge for a catalog request (intro + inferred envelope). */
  sendCatalogRequest: (text: string) => void;
  /** From the envelope's CTA: append the sourcing summary + matches carousel. */
  continueToSelection: () => void;
  /** Instantly seed the resolved thread (direct /catalog entry, no Bridge). */
  resolveDefault: () => void;
  /** Off-catalog fork: generic handoff that routes to a seeded Workbench item. */
  sendOffCatalog: (text: string, requestId: string) => void;
  /** Contract fork: in-chat service Bridge that continues to the configurator. */
  sendServiceRequest: (text: string) => void;
  /** The Workbench item an off-catalog request was routed to (for "View in Workbench"). */
  routedRequestId: string | null;
  /** Route a request to a specific Workbench item (e.g. from Configure). */
  routeToWorkbench: (id: string) => void;
  /** Consume the routed id once the Workbench has opened it. */
  clearRoutedRequest: () => void;
  /** Append an agent note to the thread (e.g. filter changes). */
  addNote: (text: string) => void;
  /** Confirm an add-to-cart in the thread (amount + limit) + Review affordance. */
  confirmAddToCart: (item: CatalogItem, quantity: number) => void;
  /** Reset to the Intake empty state. */
  startFresh: () => void;
  /** Step back one screen (Selection → Bridge → Intake). */
  stepBack: () => void;
  /** Halt an in-flight scripted stream. */
  stop: () => void;
}

export const ConversationContext =
  createContext<ConversationContextValue | null>(null);

export function useConversation(): ConversationContextValue {
  const context = useContext(ConversationContext);
  if (context == null) {
    throw new Error(
      "useConversation must be used within a ConversationProvider",
    );
  }
  return context;
}
