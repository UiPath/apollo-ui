"use client";

import { useEffect, useState } from "react";
import { MyRequestPanel } from "./MyRequestPanel";
import { MyRequestsList } from "./MyRequestsList";
import { useRequests } from "./requests-context";

/**
 * My Requests host — the list, with a request's detail as a slide-over panel off
 * it (the list stays in view). Submitting a request deep-links straight into its
 * panel via `openRequestId`, consumed on mount.
 */
export function MyRequests() {
  const { openRequestId, clearOpenRequest } = useRequests();
  const [openId, setOpenId] = useState<string | null>(() => openRequestId);

  useEffect(() => {
    if (openRequestId) clearOpenRequest();
  }, [openRequestId, clearOpenRequest]);

  return (
    <>
      <MyRequestsList onOpen={setOpenId} />
      <MyRequestPanel id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
