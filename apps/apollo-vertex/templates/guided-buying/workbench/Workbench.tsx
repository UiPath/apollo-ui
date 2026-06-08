"use client";

import { useState } from "react";
import { WorkbenchDetail } from "./WorkbenchDetail";
import { WorkbenchList } from "./WorkbenchList";

/**
 * Workbench host — the buyer's escalation queue. List view, or the three-region
 * detail once a request is opened. (Internal selection rather than a sub-route;
 * the GB shell runs an in-memory router and this keeps the back/queue nav local.)
 */
export function Workbench() {
  const [openId, setOpenId] = useState<string | null>(null);

  if (openId) {
    return (
      <WorkbenchDetail
        key={openId}
        id={openId}
        onBack={() => setOpenId(null)}
        onSelect={setOpenId}
      />
    );
  }
  return <WorkbenchList onOpen={setOpenId} />;
}
