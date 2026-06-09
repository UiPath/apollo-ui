"use client";

import { type ReactNode, useRef, useState } from "react";
import {
  AutopilotChatContext,
  type AutopilotChatValue,
  type AutopilotMessage,
} from "./autopilot-chat-context";

// Scripted stand-in reply — the FAB is the tertiary escape hatch, not a live LLM.
const REPLY =
  "Good question. I'd weigh it against your team's past requests and policy, then walk you through it here.";

/**
 * The one Autopilot conversation that follows the user across every surface
 * (Bridge → Selection → Configure → Workbench → Catalog). Lifted above the
 * router so the thread and open state persist as the user moves between steps.
 */
export function AutopilotChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<AutopilotMessage[]>([]);
  const [open, setOpenState] = useState(false);
  const [unread, setUnread] = useState(false);
  const idRef = useRef(0);
  const nextId = () => {
    idRef.current += 1;
    return `ap${idRef.current}`;
  };

  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (next) setUnread(false);
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text: trimmed },
      { id: nextId(), role: "assistant", text: REPLY },
    ]);
  };

  const note = (text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text }]);
    if (!open) setUnread(true);
  };

  const value: AutopilotChatValue = {
    messages,
    open,
    setOpen,
    unread,
    send,
    note,
  };

  return (
    <AutopilotChatContext.Provider value={value}>
      {children}
    </AutopilotChatContext.Provider>
  );
}
