"use client";

import { useEffect, useState } from "react";
import { useConversation } from "../catalog/v1/conversation-context";
import type { Decision } from "./data";
import { WorkbenchDetail } from "./WorkbenchDetail";
import { WorkbenchList } from "./WorkbenchList";

/**
 * Workbench host — the buyer's escalation queue. List view, or the three-region
 * detail once a request is opened. Decisions are held here so they persist
 * across open/close and surface in the list row's status.
 */
export function Workbench() {
  const { routedRequestId, clearRoutedRequest } = useConversation();
  // Deep-link: open the item an off-catalog request was routed to, then consume.
  const [openId, setOpenId] = useState<string | null>(() => routedRequestId);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  useEffect(() => {
    if (routedRequestId) clearRoutedRequest();
  }, [routedRequestId, clearRoutedRequest]);

  const decide = (id: string, decision: Decision) =>
    setDecisions((prev) => ({ ...prev, [id]: decision }));

  if (openId) {
    return (
      <WorkbenchDetail
        key={openId}
        id={openId}
        decision={decisions[openId] ?? null}
        onDecide={decide}
        onBack={() => setOpenId(null)}
        onSelect={setOpenId}
      />
    );
  }
  return <WorkbenchList onOpen={setOpenId} decisions={decisions} />;
}
