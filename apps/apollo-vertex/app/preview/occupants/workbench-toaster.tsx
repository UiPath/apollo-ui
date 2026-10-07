"use client";

import { type CSSProperties, useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  CHANGE_TOAST,
  holdChangeToast,
  SHOWN_MS,
  WORKBENCH_TOASTER,
} from "./use-change-log";
import type { WorkbenchTheme } from "./workbench-url-state";

/** The dock's distance from the stage's bottom, and the gap above it. */
const DOCK_BOTTOM = 24;
const GAP = 16;
/** The right-hand column's width (w-80), and the toast's own edge gap. */
const COLUMN = 320;
const EDGE = 24;

/**
 * Inverted: the text color as the toast's ground and the surface color as
 * its words, in both themes. Its Undo is an outline in the toast's own
 * colors, never the accent.
 */
// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- CSS custom properties aren't in React.CSSProperties
const INVERTED = {
  "--normal-bg": "var(--foreground)",
  "--normal-text": "var(--background)",
  "--normal-border": "var(--foreground)",
  "--border-radius": "var(--radius)",
} as CSSProperties;
const UNDO =
  "!bg-transparent !text-[var(--normal-text)] !border !border-[color-mix(in_oklab,var(--normal-text)_45%,transparent)] hover:!bg-[color-mix(in_oklab,var(--normal-text)_12%,transparent)] focus-visible:!outline-2 focus-visible:!outline-[var(--normal-text)] focus-visible:!outline-offset-1";

/** Whether Escape belongs to something else first: a field, a menu, a dialog. */
const ownedElsewhere = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest(
    "input, textarea, select, [contenteditable=true], [role=menu], [role=dialog], [role=listbox]",
  ) !== null;

interface WorkbenchToasterProps {
  theme: WorkbenchTheme;
  /** The dock's height: the toasts sit above it, however many rows it takes. */
  dockHeight: number;
  /** Whether the right-hand column is open: the toasts stay over the stage. */
  columnOpen: boolean;
}

/**
 * The workbench's toasts, in its own theme, at the stage's bottom right,
 * above the dock and clear of the right-hand column: each change to the
 * page, with an Undo. No close button: a toast goes after six seconds,
 * waits while it's hovered or its Undo has focus, swipes away, and Escape
 * dismisses it first, before Escape's other jobs. Toasts are announced
 * politely, and Undo is reachable by keyboard.
 */
export function WorkbenchToaster({
  theme,
  dockHeight,
  columnOpen,
}: WorkbenchToasterProps) {
  // Escape takes the toast first, as the top layer, and is then done.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (ownedElsewhere(event.target)) return;
      // A drag takes its own Escape: it cancels.
      const dragging = document.querySelector(
        "[data-slot=workbench-drop-zones], [data-slot=workbench-contents-dnd][data-dragging=true]",
      );
      if (dragging) return;
      const shown = document.querySelector(
        // The workbench's toaster is the one inside it.
        "[data-slot=workbench] [data-sonner-toast]:not([data-removed=true])",
      );
      if (!shown) return;
      event.preventDefault();
      toast.dismiss(CHANGE_TOAST);
    };
    // Focus on its Undo holds the toast; leaving lets it go.
    const inToast = (target: EventTarget | null) =>
      target instanceof Element &&
      target.closest("[data-sonner-toast]") !== null;
    const onFocusIn = (event: FocusEvent) => {
      if (inToast(event.target) && !inToast(event.relatedTarget))
        holdChangeToast(true);
    };
    const onFocusOut = (event: FocusEvent) => {
      if (inToast(event.target) && !inToast(event.relatedTarget))
        holdChangeToast(false);
    };
    document.addEventListener("keydown", onKey, { capture: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("keydown", onKey, { capture: true });
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);
  return (
    <Toaster
      id={WORKBENCH_TOASTER}
      theme={theme}
      position="bottom-right"
      closeButton={false}
      duration={SHOWN_MS}
      style={INVERTED}
      toastOptions={{ classNames: { actionButton: UNDO } }}
      offset={{
        bottom: DOCK_BOTTOM + dockHeight + GAP,
        right: (columnOpen ? COLUMN : 0) + EDGE,
      }}
    />
  );
}
