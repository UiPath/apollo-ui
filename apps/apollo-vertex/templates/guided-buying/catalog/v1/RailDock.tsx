import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { sidebarSpring } from "@/registry/shell/shell-animations";

// Matches the shell sidebar's collapsed icon-rail width (4rem).
const COLLAPSED_WIDTH_PX = 64;

function toPx(value: string): number {
  return value.endsWith("rem")
    ? Number.parseFloat(value) * 16
    : Number.parseFloat(value);
}

interface RailDockProps {
  open: boolean;
  hasUpdates?: boolean;
  /** Expanded panel width. Defaults to "360px". */
  width?: string;
  onExpand: () => void;
  /** Content shown in the expanded panel. */
  children: ReactNode;
}

/**
 * The docked rail container. Animates between the full assistant panel and a
 * slim launcher; the main column reflows into the reclaimed width. Uses the
 * same spring as the shell sidebar so both expand/collapse identically.
 */
export function RailDock({
  open,
  hasUpdates = false,
  width = "360px",
  onExpand,
  children,
}: RailDockProps) {
  return (
    <motion.aside
      aria-label="Assistant"
      initial={{ width: 0 }}
      animate={{ width: open ? toPx(width) : COLLAPSED_WIDTH_PX }}
      exit={{ width: 0 }}
      transition={sidebarSpring}
      // Left slot, same as the shell sidebar — border trails on the right.
      className="hidden h-full shrink-0 overflow-hidden border-r bg-card lg:block"
    >
      {open ? (
        children
      ) : (
        <button
          type="button"
          onClick={onExpand}
          aria-label="Open assistant"
          className="flex h-full w-16 flex-col items-center pt-4"
        >
          <span
            className="relative flex size-9 items-center justify-center rounded-full text-white"
            style={{ background: "var(--ai-gradient-strong)" }}
          >
            <AiMark size={18} aria-hidden />
            {hasUpdates && (
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card" />
            )}
          </span>
        </button>
      )}
    </motion.aside>
  );
}
