"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PANE_HEADING } from "./pane-grid";
import type { RailSection } from "./pane-rail-types";
import { SCROLL_PANE } from "./scroll-pane";

const SECTION_HEADING = cn(PANE_HEADING, "px-4 pb-2");

// rounded-r-lg matches the filter icon button in the list pane, which takes
// Button's base rounded-lg. Applied to every row so hover and active agree.
/**
 * Rail width, in one place because it is set twice: on the container, which
 * animates to zero when collapsed, and on the inner nav, which stays pinned so
 * the labels do not reflow mid-slide. They have to match or the collapse
 * animation scrambles the text.
 */
const RAIL_WIDTH = "w-60";

const ROW =
  "flex w-full items-center justify-between gap-2 rounded-r-lg px-4 py-2 text-sm";

function Count({ value }: { value?: number }) {
  if (typeof value !== "number") return null;

  return (
    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
      {value}
    </span>
  );
}

interface PaneRailProps<T extends string> {
  /** Accessible name for the rail's nav landmark. */
  label: string;
  /** Ties the rail to whatever toggles it, for `aria-controls`. */
  id?: string;
  /** Collapsed rails animate to zero width and go inert. */
  collapsed?: boolean;
  sections: RailSection<T>[];
  /** Id of the selected item among the interactive sections. */
  value?: T;
  onChange?: (id: T) => void;
}

/**
 * The left rail shared by both tabs. Extracted so the AP workflow rail and the
 * supplier folder rail cannot drift apart: one set of active, hover, focus and
 * truncation rules serves both.
 */
export function PaneRail<T extends string>({
  label,
  id,
  collapsed = false,
  sections,
  value,
  onChange,
}: PaneRailProps<T>) {
  return (
    <ScrollArea
      id={id}
      className={cn(
        // Width animates rather than display toggling, so the panes slide.
        "shrink-0 overflow-hidden bg-muted/30 transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
        collapsed ? "w-0" : RAIL_WIDTH,
        SCROLL_PANE,
      )}
    >
      {/* Fixed width so the labels do not reflow while the rail slides shut,
          and inert while hidden so it stays out of the tab order. */}
      <nav
        aria-label={label}
        className={cn(RAIL_WIDTH, "py-4")}
        inert={collapsed}
      >
        {sections.map((section, i) => (
          <div key={section.heading}>
            {i > 0 && <Separator className="my-3" />}
            <p className={SECTION_HEADING}>{section.heading}</p>
            <ul>
              {section.interactive
                ? section.items.map((item) => {
                    const active = item.id === value;

                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onChange?.(item.id)}
                          aria-current={active ? "true" : "false"}
                          className={cn(
                            ROW,
                            "border-l-2 text-left transition-colors",
                            "outline-none focus-visible:border-l-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            active
                              ? "border-l-primary bg-accent font-semibold text-foreground"
                              : "border-l-transparent text-muted-foreground hover:bg-muted/60",
                          )}
                        >
                          <span className="min-w-0 truncate">{item.label}</span>
                          <Count value={item.count} />
                        </button>
                      </li>
                    );
                  })
                : section.items.map((item) => (
                    <li key={item.label}>
                      <div className={cn(ROW, "text-muted-foreground")}>
                        <span className="min-w-0 truncate">{item.label}</span>
                        <Count value={item.count} />
                      </div>
                    </li>
                  ))}
            </ul>
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
}
