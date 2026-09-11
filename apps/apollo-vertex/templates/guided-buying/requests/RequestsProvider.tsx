"use client";

import { type ReactNode, useState } from "react";
import { getPerson } from "../data/people";
import { IDENTITY } from "../data/req-10482";
import { type RequestRow, submittedTime } from "./data";
import {
  type ExceptionOverride,
  type FieldException,
  type ReceiptRecord,
  type RequestNote,
  RequestsContext,
  type RequestsContextValue,
} from "./requests-context";

/**
 * Shared state across the two seats: the requester's My Requests and the buyer's
 * Workbench are two lenses on the same requests. A note the requester posts shows
 * up in that request's Comms tab in the Workbench; an urgent flag marks it on the
 * buyer side. Mocked: no backend, state lives for the session.
 */
// The requester's opening note on each request, folded into the thread as
// a real entry instead of a separate authored string rendered outside it:
// every message in the panel is now the same shape. Its origin (Teams vs.
// the app) is unresolved, PLACEHOLDER [Seeded message origin], so it
// defaults to "app" (no marker) rather than asserting a channel that isn't
// confirmed.
const INITIAL_THREADS: Record<string, RequestNote[]> = {
  "REQ-2052": [
    {
      id: "REQ-2052-n0",
      author: "Marcus Webb",
      text: "Hi Alex, these are for the Fusion contractors starting Aug 3. Happy to answer anything.",
      time: "2:14 PM",
      source: "app",
    },
    // PLACEHOLDER [Teams-sourced demo message]: content invented, so it's
    // bracketed; this is what proves the provenance rendering actually
    // fires somewhere in the running app.
    {
      id: "REQ-2052-n1",
      author: "Alex Chen",
      text: "[Teams-sourced message text]",
      time: "9:14 AM",
      source: "teams",
    },
  ],
  "REQ-2054": [
    {
      id: "REQ-2054-n0",
      author: "Lena Fischer",
      text: "12 seats for the design team's Creative Cloud renewal.",
      time: "2:14 PM",
      source: "app",
    },
  ],
  // Chunk C1 cleanup (escalation 6): was empty, so the composer sat under
  // a bare heading with nothing to demonstrate. One opening note, the same
  // shape as REQ-2052's own first message above: author and time are real
  // (the requester, the timeline's own "submitted" event), the text itself
  // is a content ruling, bracketed the same way REQ-2052's own Teams
  // message text above is.
  "REQ-10482": [
    {
      id: "REQ-10482-n0",
      author: getPerson(IDENTITY.requester).name,
      text: "[Message text]",
      time: submittedTime,
      source: "app",
    },
  ],
};

export function RequestsProvider({ children }: { children: ReactNode }) {
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [threads, setThreads] =
    useState<Record<string, RequestNote[]>>(INITIAL_THREADS);
  const [urgent, setUrgent] = useState<Record<string, boolean>>({});
  const [submittedRows, setSubmittedRows] = useState<RequestRow[]>([]);
  const [receipts, setReceipts] = useState<Record<string, ReceiptRecord>>({});
  const [requestStatusOverrides, setRequestStatusOverrides] = useState<
    Record<string, "approved" | "denied" | "sent-back">
  >({});
  const [approvedAt, setApprovedAt] = useState<Record<string, number>>({});
  const [fieldExceptions, setFieldExceptions] = useState<
    Record<string, FieldException[]>
  >({});
  const [exceptionOverrides, setExceptionOverrides] = useState<
    Record<string, Record<string, ExceptionOverride>>
  >({});

  const openRequest = (id: string) => setOpenRequestId(id);
  const clearOpenRequest = () => setOpenRequestId(null);

  const addNote = (
    requestId: string,
    text: string,
    author = "Marcus Webb",
    source: "teams" | "app" = "app",
    channelName?: string,
  ) => {
    setThreads((prev) => {
      const existing = prev[requestId] ?? [];
      const note: RequestNote = {
        id: `${requestId}-n${existing.length}`,
        author,
        text,
        time: "Just now",
        source,
        channelName,
      };
      return { ...prev, [requestId]: [...existing, note] };
    });
  };

  const markUrgent = (requestId: string) => {
    setUrgent((prev) => ({ ...prev, [requestId]: true }));
  };

  const submitRequest = (row: RequestRow) => {
    setSubmittedRows((prev) => {
      if (prev.some((r) => r.id === row.id)) return prev;
      return [row, ...prev];
    });
  };

  const confirmReceipt = (
    requestId: string,
    record: Omit<ReceiptRecord, "confirmedAt">,
  ) => {
    setReceipts((prev) => ({
      ...prev,
      [requestId]: { ...record, confirmedAt: "Just now" },
    }));
  };

  const approveRequest = (requestId: string) => {
    setRequestStatusOverrides((prev) => ({ ...prev, [requestId]: "approved" }));
    setApprovedAt((prev) => ({ ...prev, [requestId]: Date.now() }));
  };

  const denyRequest = (requestId: string) => {
    setRequestStatusOverrides((prev) => ({ ...prev, [requestId]: "denied" }));
  };

  const sendBackRequest = (requestId: string) => {
    setRequestStatusOverrides((prev) => ({
      ...prev,
      [requestId]: "sent-back",
    }));
  };

  const addFieldException = (
    requestId: string,
    exception: Omit<FieldException, "id">,
  ) => {
    setFieldExceptions((prev) => {
      const existing = prev[requestId] ?? [];
      const record: FieldException = {
        id: `${requestId}-x${existing.length}`,
        ...exception,
      };
      return { ...prev, [requestId]: [...existing, record] };
    });
  };

  const acceptException = (requestId: string, exceptionId: string) => {
    setExceptionOverrides((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [exceptionId]: { status: "resolved" },
      },
    }));
  };

  const requestExceptionCorrection = (
    requestId: string,
    exceptionId: string,
    waitingOn: string,
  ) => {
    setExceptionOverrides((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [exceptionId]: { status: "waiting", waitingOn },
      },
    }));
  };

  const resolveExceptionByDocument = (
    requestId: string,
    exceptionId: string,
  ) => {
    setExceptionOverrides((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [exceptionId]: { status: "resolved" },
      },
    }));
  };

  const value: RequestsContextValue = {
    openRequestId,
    openRequest,
    clearOpenRequest,
    threads,
    addNote,
    urgent,
    markUrgent,
    submittedRows,
    submitRequest,
    receipts,
    confirmReceipt,
    requestStatusOverrides,
    approvedAt,
    approveRequest,
    denyRequest,
    sendBackRequest,
    fieldExceptions,
    addFieldException,
    exceptionOverrides,
    acceptException,
    requestExceptionCorrection,
    resolveExceptionByDocument,
  };

  return (
    <RequestsContext.Provider value={value}>
      {children}
    </RequestsContext.Provider>
  );
}
