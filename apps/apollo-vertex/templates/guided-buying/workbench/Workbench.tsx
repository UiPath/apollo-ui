"use client";

import { useEffect, useRef, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { useConversation } from "../catalog/v1/conversation-context";
import type { Decision, WorkbenchStatus } from "./data";
import { WorkbenchDetail } from "./WorkbenchDetail";
import type { LeftPanelContent, LeftPanelState } from "./WorkbenchLeftPanel";
import { WorkbenchList } from "./WorkbenchList";

/**
 * Workbench host, the buyer's escalation queue. List view, or the three-region
 * detail once a request is opened. Decisions are held here so they persist
 * across open/close and surface in the list row's status.
 *
 * The left panel's collapse state, its last-shown content, the queue's
 * selected segment (prompt 32), the shell sidebar's manual override (prompt
 * 34), and now the right activity rail's own collapse state (prompt 40) all
 * live here too, for the same reason decisions do: `WorkbenchDetail`
 * remounts on every request change (its own `key={openId}` below), so any
 * state that must survive moving between requests, but still reset on a
 * real reload, has to live in this component instead, which only mounts
 * once per page load. `rightPanelOpen` is a plain boolean, not an object
 * like `leftPanel`: the right rail has no equivalent "which content" choice
 * to remember, only open or collapsed. Defaults to `true` (not collapsed by
 * default, per the prompt), matching `leftPanel`'s own default. */
export function Workbench() {
  const { routedRequestId, clearRoutedRequest } = useConversation();
  // Deep-link: open the item an off-catalog request was routed to, then consume.
  const [openId, setOpenId] = useState<string | null>(() => routedRequestId);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [leftPanel, setLeftPanel] = useState<LeftPanelState>({
    open: true,
    content: "queue",
  });
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [selectedQueueSegment, setSelectedQueueSegment] = useState<
    WorkbenchStatus | "all"
  >("all");

  useEffect(() => {
    if (routedRequestId) clearRoutedRequest();
  }, [routedRequestId, clearRoutedRequest]);

  // Focus mode (prompt 34): the shell sidebar collapses while a request is
  // open and restores once it isn't, driven by `openId` rather than by
  // `WorkbenchDetail`'s own mount lifecycle, since switching from one open
  // request straight to another also remounts `WorkbenchDetail` (its own
  // `key={openId}`) without ever passing through the list. Reusing this
  // effect's own transition on `openId`, not that mount/unmount, is what
  // keeps that switch from flashing the sidebar open and shut again.
  //
  // The override is a plain boolean here, for the same reason `decisions`
  // and the left panel state are here: it has to survive a request change,
  // and reset only on reload, so it can't live inside `WorkbenchDetail`
  // itself. `sidebarChangeIsOurs` distinguishes a change this effect made
  // from one the user made by clicking the shell's own sidebar toggle,
  // since `useSidebar()` exposes only the current state, not who set it.
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const [sidebarOverridden, setSidebarOverridden] = useState(false);
  const sidebarChangeIsOurs = useRef(false);

  useEffect(() => {
    sidebarChangeIsOurs.current = true;
    if (openId == null) {
      setSidebarOpen(true);
    } else if (!sidebarOverridden) {
      setSidebarOpen(false);
    }
    // Only `openId` drives this: panel toggles (queue/assistant) and
    // `sidebarOverridden` changing on their own must not re-run it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  useEffect(() => {
    if (sidebarChangeIsOurs.current) {
      sidebarChangeIsOurs.current = false;
      return;
    }
    // A change we didn't make: the user expanded it themselves while in the
    // detail view. Stays expanded for the rest of the session (prompt 34).
    if (openId != null && sidebarOpen) setSidebarOverridden(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarOpen]);

  const decide = (id: string, decision: Decision) =>
    setDecisions((prev) => ({ ...prev, [id]: decision }));

  // Rail click: an inactive item swaps the panel to it; the active item
  // collapses the panel; either item opens the panel to itself when
  // collapsed (prompt 32, item 1).
  const handleRailClick = (content: LeftPanelContent) => {
    setLeftPanel((prev) =>
      prev.open && prev.content === content
        ? { ...prev, open: false }
        : { open: true, content },
    );
  };

  const handleLeftPanelCollapse = () => {
    setLeftPanel((prev) => ({ ...prev, open: false }));
  };

  const toggleRightPanel = () => setRightPanelOpen((prev) => !prev);

  if (openId) {
    return (
      <WorkbenchDetail
        key={openId}
        id={openId}
        decision={decisions[openId] ?? null}
        onDecide={decide}
        onBack={() => setOpenId(null)}
        onSelect={setOpenId}
        decisions={decisions}
        leftPanel={leftPanel}
        onLeftPanelRailClick={handleRailClick}
        onLeftPanelCollapse={handleLeftPanelCollapse}
        selectedQueueSegment={selectedQueueSegment}
        onSelectQueueSegment={setSelectedQueueSegment}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={toggleRightPanel}
      />
    );
  }
  return <WorkbenchList onOpen={setOpenId} decisions={decisions} />;
}
