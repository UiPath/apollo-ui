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

/** The requester's confirmation that goods arrived, by request id. */
export interface ReceiptRecord {
  qtyOrdered: number;
  qtyReceived: number;
  damaged: boolean;
  note?: string;
  confirmedAt: string;
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
  /** Delivery receipts confirmed during this session, by request id. */
  receipts: Record<string, ReceiptRecord>;
  confirmReceipt: (
    requestId: string,
    record: Omit<ReceiptRecord, "confirmedAt">,
  ) => void;
  /** Status written by an approval decision, by request id. Surfaces that
   * show request status read this first and fall back to the static seed
   * value when a request has no entry here. */
  requestStatusOverrides: Record<string, "approved" | "denied">;
  approveRequest: (requestId: string) => void;
  denyRequest: (requestId: string) => void;
}

export const RequestsContext = createContext<RequestsContextValue | null>(null);

export function useRequests(): RequestsContextValue {
  const context = useContext(RequestsContext);
  if (context == null) {
    throw new Error("useRequests must be used within a RequestsProvider");
  }
  return context;
}
