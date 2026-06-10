"use client";

import { type ReactNode, useState } from "react";
import {
  RequestsContext,
  type RequestsContextValue,
  type RequestNote,
} from "./requests-context";

/**
 * Shared state across the two seats: the requester's My Requests and the buyer's
 * Workbench are two lenses on the same requests. A note the requester posts shows
 * up in that request's Comms tab in the Workbench; an urgent flag marks it on the
 * buyer side. Mocked: no backend, state lives for the session.
 */
export function RequestsProvider({ children }: { children: ReactNode }) {
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, RequestNote[]>>({});
  const [urgent, setUrgent] = useState<Record<string, boolean>>({});

  const openRequest = (id: string) => setOpenRequestId(id);
  const clearOpenRequest = () => setOpenRequestId(null);

  const addNote = (requestId: string, text: string) => {
    setThreads((prev) => {
      const existing = prev[requestId] ?? [];
      const note: RequestNote = {
        id: `${requestId}-n${existing.length}`,
        author: "Marcus Webb",
        text,
        time: "Just now",
      };
      return { ...prev, [requestId]: [...existing, note] };
    });
  };

  const markUrgent = (requestId: string) => {
    setUrgent((prev) => ({ ...prev, [requestId]: true }));
  };

  const value: RequestsContextValue = {
    openRequestId,
    openRequest,
    clearOpenRequest,
    threads,
    addNote,
    urgent,
    markUrgent,
  };

  return (
    <RequestsContext.Provider value={value}>
      {children}
    </RequestsContext.Provider>
  );
}
