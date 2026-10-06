"use client";

import { Toaster } from "@/components/ui/sonner";
import { WORKBENCH_TOASTER } from "./use-change-log";
import type { WorkbenchTheme } from "./workbench-url-state";

interface WorkbenchToasterProps {
  theme: WorkbenchTheme;
}

/**
 * The workbench's toasts, in its own theme, at the bottom right, above
 * the dock: each change to the page, with an Undo.
 */
/** Above the dock: its 24px from the bottom, its height, and a gap. */
const ABOVE_DOCK = "7rem";

export function WorkbenchToaster({ theme }: WorkbenchToasterProps) {
  return (
    <Toaster
      id={WORKBENCH_TOASTER}
      theme={theme}
      position="bottom-right"
      offset={{ bottom: ABOVE_DOCK }}
    />
  );
}
