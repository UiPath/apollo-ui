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
  | "sourcing"
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
  /** What the user prompted (free text or a starter chip) — shown verbatim on
   * the Bridge and in the request detail sidebar. Never truncated. */
  requestText: string | null;
  /** Short (~6 word) generated title, stable for the life of the request —
   * chrome everywhere else (headers, thread title, Requests list). Set once
   * per fresh submission (initial or post-Revise); untouched by field edits. */
  requestTitle: string | null;
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
  /** Sourcing fork: services Bridge for an RFQ that routes to procurement. */
  sendSourcingRequest: (text: string) => void;
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
  /**
   * Returns to Intake with the current request text staged for the composer,
   * so the user can restate it as a new turn (the agent then re-derives the
   * whole envelope) rather than editing the request as a single field.
   */
  reviseRequest: () => void;
  /** Staged by `reviseRequest` for the composer to pick up once Intake mounts
   * — read once, then cleared via `clearPendingRevision`. */
  pendingRevisionText: string | null;
  /** Marks the staged revision text as consumed. */
  clearPendingRevision: () => void;
  /** The prior request text, set by `reviseRequest` for the Bridge to describe
   * the restatement once it re-mounts — read once, then cleared. */
  revisedFrom: string | null;
  /** Marks the one-shot revision note as consumed. */
  clearRevisedFrom: () => void;
  /** Bridge envelope fields the user has directly overridden (keyed by field
   * key, e.g. "cost"/"ship"/"need"/"approver") — carried across a Revise so
   * re-deriving the envelope doesn't discard the user's own picks. Cleared by
   * `startFresh`. */
  envelopeOverrides: Record<string, string>;
  /** Record a direct user override for a Bridge envelope field. */
  setEnvelopeOverride: (key: string, value: string) => void;
  /** Clear a Bridge envelope field's override (e.g. reverted to the default). */
  clearEnvelopeOverride: (key: string) => void;
  /** Deep-link support: instantly seeds the equivalent end-state for a Buy
   * sub-phase, skipping the scripted stream/skeleton delays — used when
   * /buy is reached directly with a phase already in the URL, or when
   * browser back/forward lands on a phase with no local state to match it.
   * Always seeds the canonical catalog scenario (no backend to recover a
   * specific in-progress request from). */
  seedPhase: (phase: "bridge" | "selection") => void;
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
