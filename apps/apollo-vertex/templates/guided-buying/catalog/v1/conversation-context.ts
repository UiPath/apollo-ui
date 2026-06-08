"use client";

import type { ChatClientState, UIMessage } from "@tanstack/ai-client";
import { createContext, useContext } from "react";
import type { CatalogItem } from "./types";

export interface ConversationContextValue {
  messages: UIMessage[];
  status: ChatClientState;
  /** True once the first request has resolved — the workspace then exists. */
  hasResolved: boolean;
  /** Run the scripted Bridge for a catalog request (intro + inferred envelope). */
  sendCatalogRequest: (text: string) => void;
  /** From the envelope's CTA: append the sourcing summary + matches carousel. */
  continueToSelection: () => void;
  /** Instantly seed the resolved thread (direct /catalog entry, no Bridge). */
  resolveDefault: () => void;
  /** Preview the off-catalog fork (quote/contract) — routes to Workbench later. */
  sendOffCatalog: (text: string) => void;
  /** Append an agent note to the thread (e.g. filter changes). */
  addNote: (text: string) => void;
  /** Confirm an add-to-cart in the thread (amount + limit) + Review affordance. */
  confirmAddToCart: (item: CatalogItem, quantity: number) => void;
  /** Reset to the Intake empty state. */
  startFresh: () => void;
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
