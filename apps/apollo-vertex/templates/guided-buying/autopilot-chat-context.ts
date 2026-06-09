"use client";

import { createContext, useContext } from "react";

export interface AutopilotMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface AutopilotChatValue {
  /** The one thread that follows the user across steps. */
  messages: AutopilotMessage[];
  open: boolean;
  setOpen: (open: boolean) => void;
  /** True when the agent has surfaced something while the popover was closed. */
  unread: boolean;
  /** User asks a question; a scripted agent reply follows. */
  send: (text: string) => void;
  /** Agent surfaces something proactively (e.g. a filter change). */
  note: (text: string) => void;
}

export const AutopilotChatContext = createContext<AutopilotChatValue | null>(
  null,
);

export function useAutopilotChat(): AutopilotChatValue {
  const ctx = useContext(AutopilotChatContext);
  if (ctx == null) {
    throw new Error(
      "useAutopilotChat must be used within an AutopilotChatProvider",
    );
  }
  return ctx;
}
