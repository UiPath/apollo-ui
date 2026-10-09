"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Each column's open width: the list's and the right-hand column's. */
const OPEN_WIDTH = {
  list: "data-[state=open]:w-66",
  column: "data-[state=open]:w-80",
} as const;

interface WorkbenchPanelProps {
  /** The panel's id: its toggle names it in aria-controls. */
  id: string;
  open: boolean;
  /** Which column: its open width, and which edge its content keeps to. */
  kind: keyof typeof OPEN_WIDTH;
  children: ReactNode;
}

/**
 * One of the workbench's own side columns, opening and closing on the
 * Shell's panel tokens, so the stage beside it resizes with it. Its box
 * animates its width and clips; the content keeps its own width, so it
 * never reflows mid-close, and goes invisible and inert once a close has
 * finished. Reduced motion opens and closes it at once.
 *
 * Opened from its toggle, focus moves into it; closed with focus inside,
 * focus goes back to the toggle.
 */
export function WorkbenchPanel({
  id,
  open,
  kind,
  children,
}: WorkbenchPanelProps) {
  const was = useRef(open);
  useEffect(() => {
    if (was.current === open) return;
    was.current = open;
    const panel = document.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    const toggle = document.querySelector<HTMLElement>(
      `[aria-controls="${id}"][aria-expanded]`,
    );
    const focused = document.activeElement;
    if (open && toggle && focused === toggle) panel?.focus();
    if (!open && panel && focused && panel.contains(focused)) toggle?.focus();
  }, [id, open]);
  const state = open ? "open" : "closed";
  return (
    <div
      data-slot="workbench-panel"
      data-panel={kind}
      data-state={state}
      className={cn(
        "flex w-0 shrink-0 overflow-hidden transition-[width] duration-(--panel-transition-duration) ease-(--panel-transition-easing) motion-reduce:transition-none",
        OPEN_WIDTH[kind],
        // The right-hand column keeps to the window's edge as it opens.
        kind === "column" && "justify-end",
      )}
    >
      <div
        data-state={state}
        inert={!open}
        className="flex h-full shrink-0 transition-[visibility] data-[state=closed]:invisible data-[state=closed]:delay-(--panel-transition-duration) motion-reduce:transition-none"
      >
        {children}
      </div>
    </div>
  );
}
