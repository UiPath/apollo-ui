"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ConfidenceSignal } from "@/registry/confidence-signal/confidence-signal";
import type { SupplierCase } from "../data/supplier-cases";
import { CONTROL_TONE, confidenceLevel } from "./control-tone";
import { SCROLL_PANE } from "./scroll-pane";

/**
 * The preview line, derived rather than stored: the inbound body for a real
 * email, the trigger reason for a case a monitor opened. Newlines collapse to
 * spaces the way a mail client previews a message.
 */
function snippet(c: SupplierCase): string {
  return (c.email ?? c.triggerReason ?? "").replaceAll(/\s+/g, " ").trim();
}

/**
 * The confidence chip for a row. Icon-only, so it reads as a signal rather than
 * a third pill. Medium and low levels require a next step, so theirs opens the
 * case, which is the only action a list row actually has.
 */
function RowSignal({
  case: c,
  onSelect,
}: {
  case: SupplierCase;
  onSelect: (id: string) => void;
}) {
  const level = confidenceLevel(c);
  if (!level) return null;

  const open = { label: "Open this case", onClick: () => onSelect(c.id) };

  return (
    <span className="pointer-events-auto inline-flex">
      {level === "high" ? (
        <ConfidenceSignal level="high" variant="min" />
      ) : (
        <ConfidenceSignal level={level} variant="min" nextStep={open} />
      )}
    </span>
  );
}

interface CaseListProps {
  cases: SupplierCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CaseList({ cases, selectedId, onSelect }: CaseListProps) {
  return (
    <ScrollArea className={cn("size-full", SCROLL_PANE)}>
      {cases.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No open cases in this workflow.
        </p>
      ) : (
        <ul>
          {cases.map((c) => {
            const selected = c.id === selectedId;
            // Anything the agent did not close on its own still has human work
            // outstanding, so it carries the unread weight.
            const needsAction = c.control !== "auto";

            return (
              // The row's click target is a stretched overlay button rather than
              // a wrapper, because the confidence chip renders its own <button>
              // and nesting one button inside another is invalid HTML that
              // breaks both click handling and focus order.
              <li
                key={c.id}
                className={cn(
                  "relative border-b border-l-2 border-b-border transition-colors",
                  selected
                    ? "border-l-primary bg-accent"
                    : "border-l-transparent hover:bg-muted/60",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={selected ? "true" : "false"}
                  aria-label={`${c.supplier}: ${c.subject}`}
                  className="absolute inset-0 z-0 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
                />

                <div className="pointer-events-none relative z-10 flex gap-2.5 px-3 py-3">
                  {/* Fixed gutter so read and unread rows align */}
                  <span className="mt-1.5 flex w-1.5 shrink-0 justify-center">
                    {needsAction && (
                      <span
                        className="size-1.5 rounded-full bg-primary"
                        aria-hidden
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "min-w-0 truncate text-sm text-foreground",
                          needsAction ? "font-semibold" : "font-normal",
                        )}
                      >
                        {c.supplier}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.time}
                      </span>
                    </span>

                    <span className="mt-0.5 block truncate text-xs text-foreground">
                      {c.subject}
                    </span>

                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {snippet(c)}
                    </span>

                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <RowSignal case={c} onSelect={onSelect} />
                      <Badge variant="secondary">{c.wfLabel}</Badge>
                      <Badge
                        status={CONTROL_TONE[c.control].badge}
                        variant="secondary"
                      >
                        {c.controlLabel}
                      </Badge>
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ScrollArea>
  );
}
