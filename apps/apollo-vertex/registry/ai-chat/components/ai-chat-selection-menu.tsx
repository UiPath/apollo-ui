"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AutopilotGradientIcon } from "./icons/autopilot-gradient";

interface AiChatSelectionMenuProps {
  x: number;
  y: number;
  onAsk: () => void;
  onDismiss: () => void;
}

export function AiChatSelectionMenu({
  x,
  y,
  onAsk,
  onDismiss,
}: AiChatSelectionMenuProps) {
  const ref = useRef<HTMLButtonElement>(null);

  // Dismiss on outside mousedown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current &&
        !(e.target instanceof Node && ref.current.contains(e.target))
      ) {
        onDismiss();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onDismiss]);

  return createPortal(
    <button
      ref={ref}
      type="button"
      onMouseDown={(e) => {
        // Prevent the mousedown from clearing the selection before onAsk fires
        e.preventDefault();
      }}
      onClick={onAsk}
      className="fixed z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border shadow-md text-xs font-semibold text-foreground hover:bg-muted transition-colors"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -100%) translateY(-8px)",
      }}
      aria-label="Ask Autopilot about selected text"
    >
      <AutopilotGradientIcon size={14} aria-hidden="true" />
      {"Ask Autopilot"}
    </button>,
    document.body,
  );
}
