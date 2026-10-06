"use client";

import { Toaster } from "@/components/ui/sonner";
import { WORKBENCH_TOASTER } from "./use-change-log";
import type { WorkbenchTheme } from "./workbench-url-state";

/** The dock's distance from the stage's bottom, and the gap above it. */
const DOCK_BOTTOM = 24;
const GAP = 16;
/** The right-hand column's width (w-80), and the toast's own edge gap. */
const COLUMN = 320;
const EDGE = 24;

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
 * page, with an Undo.
 */
export function WorkbenchToaster({
  theme,
  dockHeight,
  columnOpen,
}: WorkbenchToasterProps) {
  return (
    <Toaster
      id={WORKBENCH_TOASTER}
      theme={theme}
      position="bottom-right"
      offset={{
        bottom: DOCK_BOTTOM + dockHeight + GAP,
        right: (columnOpen ? COLUMN : 0) + EDGE,
      }}
    />
  );
}
