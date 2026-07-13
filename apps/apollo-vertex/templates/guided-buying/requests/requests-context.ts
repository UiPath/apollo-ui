"use client";

import { createContext, useContext } from "react";
import type { RequestRow } from "./data";

/** A follow-up note from the requester — surfaces in the buyer's Comms tab. */
export interface RequestNote {
  id: string;
  author: string;
  text: string;
  time: string;
}

export interface RequestsContextValue {
  /** Which request detail to open on landing in My Requests (deep-link). */
  openRequestId: string | null;
  openRequest: (id: string) => void;
  clearOpenRequest: () => void;
  /** Requester → buyer: notes posted from a request's detail, by request id. */
  threads: Record<string, RequestNote[]>;
  addNote: (requestId: string, text: string) => void;
  /** Requester → buyer: requests the requester flagged urgent, by request id. */
  urgent: Record<string, boolean>;
  markUrgent: (requestId: string) => void;
  /** Requests submitted during this session (e.g. via the catalog flow). */
  submittedRows: RequestRow[];
  submitRequest: (row: RequestRow) => void;
}

export const RequestsContext = createContext<RequestsContextValue | null>(null);

export function useRequests(): RequestsContextValue {
  const context = useContext(RequestsContext);
  if (context == null) {
    throw new Error("useRequests must be used within a RequestsProvider");
  }
  return context;
}
