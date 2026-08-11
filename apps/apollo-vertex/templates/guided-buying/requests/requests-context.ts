"use client";

import { createContext, useContext } from "react";
import type { RequestRow } from "./data";

/** A follow-up note from the requester — surfaces in the buyer's Comms tab. */
export interface RequestNote {
  id: string;
  author: string;
  text: string;
  time: string;
  /** Where the message originated. Teams and the app are two windows onto
   * the same thread, not two threads — this is how a rendered message
   * shows which window it came through. */
  source: "teams" | "app";
  /** Only meaningful when `source` is "teams". */
  channelName?: string;
}

/**
 * Derived provenance for a thread entry — `undefined` for app-composed
 * notes (the app is the surface you're already looking at, so it needs no
 * marker), the channel name for Teams-sourced ones. `RecordEntry` renders
 * this as an inline byline marker (icon + "Teams"), not a standalone line —
 * this function only decides *whether* a note is Teams-sourced and which
 * channel, not how that's displayed. One function, read by both the
 * approver's Communication rail and the requester's Request Window, so the
 * rule can't drift between the two surfaces.
 */
export function noteProvenance(
  note: RequestNote,
  fallbackChannel: string,
): string | undefined {
  if (note.source !== "teams") return undefined;
  return note.channelName ?? fallbackChannel;
}

/** A requester's exception request against a locked field's owner-set
 * default — the default itself is never overwritten; this is a parallel
 * record both the approver and (where a surface exists) the buyer can read. */
export interface FieldException {
  id: string;
  field: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  requester: string;
  timestamp: string;
  /** Who owns the field's default and decides this ask — derived from the
   * field's own provenance record at the point the exception was requested,
   * not re-looked-up here (this layer has no access to that data). */
  ownerName: string;
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
  /** Author defaults to the requester ("Marcus Webb") — the approver side
   * (Decision Window's composer, Send back) passes its own name so a note
   * left there attributes correctly in this same shared thread. `source`
   * defaults to "app" — every existing call site is unaffected. */
  addNote: (
    requestId: string,
    text: string,
    author?: string,
    source?: "teams" | "app",
    channelName?: string,
  ) => void;
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
  requestStatusOverrides: Record<string, "approved" | "denied" | "sent-back">;
  /** Real timestamp (ms since epoch) of the moment a request was approved
   * this session — the seed data has no such field, so this is the only
   * source for "which approval is most recent" and how long ago it was. */
  approvedAt: Record<string, number>;
  approveRequest: (requestId: string) => void;
  denyRequest: (requestId: string) => void;
  sendBackRequest: (requestId: string) => void;
  /** Field exceptions requested during this session, by request id. */
  fieldExceptions: Record<string, FieldException[]>;
  addFieldException: (
    requestId: string,
    exception: Omit<FieldException, "id">,
  ) => void;
}

export const RequestsContext = createContext<RequestsContextValue | null>(null);

export function useRequests(): RequestsContextValue {
  const context = useContext(RequestsContext);
  if (context == null) {
    throw new Error("useRequests must be used within a RequestsProvider");
  }
  return context;
}
