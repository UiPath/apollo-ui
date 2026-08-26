"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { RailSection } from "./pane-rail-types";
import { SCROLL_PANE } from "./scroll-pane";

const SECTION_HEADING =
  "px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

const ROW =
  "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-sm";

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
  sections,
  value,
  onChange,
}: PaneRailProps<T>) {
  return (
    <ScrollArea
      className={cn(
        "w-56 shrink-0 border-r border-border bg-card",
        SCROLL_PANE,
      )}
    >
      <nav aria-label={label} className="py-3">
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
