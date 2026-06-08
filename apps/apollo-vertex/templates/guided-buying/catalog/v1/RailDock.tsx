import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { cn } from "@/lib/utils";
import { ChatRail } from "./ChatRail";

interface RailDockProps {
  open: boolean;
  hasUpdates: boolean;
  onCollapse: () => void;
  onExpand: () => void;
}

/**
 * The docked rail container. Animates between the full assistant panel and a
 * slim launcher; the main column reflows into the reclaimed width.
 */
export function RailDock({
  open,
  hasUpdates,
  onCollapse,
  onExpand,
}: RailDockProps) {
  return (
    <aside
      aria-label="Assistant"
      className={cn(
        "hidden shrink-0 overflow-hidden border-l bg-card transition-[width] duration-300 ease-out lg:block",
        open ? "w-[360px]" : "w-14",
      )}
    >
      {open ? (
        <ChatRail onCollapse={onCollapse} />
      ) : (
        <button
          type="button"
          onClick={onExpand}
          aria-label="Open assistant"
          className="flex h-full w-14 flex-col items-center pt-4"
        >
          <span
            className="relative flex size-9 items-center justify-center rounded-full text-white"
            style={{ background: "var(--ai-gradient-strong)" }}
          >
            <AutopilotIcon size={18} aria-hidden />
            {hasUpdates && (
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card" />
            )}
          </span>
        </button>
      )}
    </aside>
  );
}
