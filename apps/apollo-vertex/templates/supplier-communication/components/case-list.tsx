"use client";

import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ConfidenceSignal } from "@/registry/confidence-signal/confidence-signal";
import type { SupplierCase } from "../data/supplier-cases";
import { isStatusFilter, type StatusFilter } from "./case-filters";
import { DATE_GROUPS, dateGroup, relativeTime } from "./case-time";
import { CONTROL_TONE, confidenceLevel } from "./control-tone";
import { PANE_HEADING } from "./pane-grid";
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

function CaseCard({
  case: c,
  selected,
  onSelect,
}: {
  case: SupplierCase;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  // Date groups say when a case arrived, not whether it needs you, so the dot
  // is carrying its own information again.
  const needsAction = c.control !== "auto";

  return (
    // Card's own `selectable` prop renders a <button>, which would nest inside
    // the confidence chip's button. So the card stays presentational and the
    // click target is a stretched overlay.
    <Card
      variant="glass"
      className={cn(
        "relative gap-0 py-0 transition-colors",
        selected
          ? "border-primary dark:border-primary"
          : "hover:border-primary/40 dark:hover:border-primary/40",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(c.id)}
        aria-current={selected ? "true" : "false"}
        aria-label={`${c.supplier}: ${c.subject}`}
        className="absolute inset-0 z-0 rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
      />

      <CardContent className="pointer-events-none relative z-10 flex gap-2.5 px-3 py-3">
        {/* Fixed gutter so read and unread rows align */}
        <span className="mt-1.5 flex w-1.5 shrink-0 justify-center">
          {needsAction && (
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
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
              {relativeTime(c.receivedAt)}
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
            <Badge status={CONTROL_TONE[c.control].badge} variant="secondary">
              {c.controlLabel}
            </Badge>
          </span>
        </span>
      </CardContent>
    </Card>
  );
}

interface CaseListProps {
  /** Already narrowed by both the rail's workflow filter and the status tab. */
  cases: SupplierCase[];
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  /** Tab counts, from the workflow-filtered set before the status tab applies. */
  counts: Record<StatusFilter, number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Workflow rail visibility, toggled from the filter button in this pane. */
  railOpen: boolean;
  onToggleRail: () => void;
  railId: string;
}

export function CaseList({
  cases,
  status,
  onStatusChange,
  counts,
  selectedId,
  onSelect,
  railOpen,
  onToggleRail,
  railId,
}: CaseListProps) {
  // Date buckets, in fixed order, dropping any this scope leaves empty.
  const groups = DATE_GROUPS.map((g) => ({
    ...g,
    cases: cases.filter((c) => dateGroup(c.receivedAt) === g.id),
  })).filter((g) => g.cases.length > 0);

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* pt-4 + the heading's pb-2 match the rail's nav padding and heading,
          so INBOX sits on the WORKFLOWS baseline and the 36px tab row lands
          level with the rail's first item. */}
      <div className="shrink-0 px-4 pt-4">
        <p className={cn(PANE_HEADING, "pb-2")}>Inbox</p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleRail}
            aria-expanded={railOpen}
            aria-controls={railId}
            aria-label={railOpen ? "Hide workflows" : "Show workflows"}
            className={cn("shrink-0", railOpen && "bg-accent text-foreground")}
          >
            <SlidersHorizontal />
          </Button>

          <Tabs
            value={status}
            onValueChange={(v) => {
              if (isStatusFilter(v)) onStatusChange(v);
            }}
            className="min-w-0 flex-1 gap-0"
          >
            <TabsList className="w-full">
              <TabsTrigger value="all" className="text-xs">
                All
                <span className="tabular-nums opacity-70">{counts.all}</span>
              </TabsTrigger>
              <TabsTrigger value="needs" className="text-xs">
                Needs you
                <span className="tabular-nums opacity-70">{counts.needs}</span>
              </TabsTrigger>
              <TabsTrigger value="flight" className="text-xs">
                In flight
                <span className="tabular-nums opacity-70">{counts.flight}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <ScrollArea className={cn("min-h-0 flex-1", SCROLL_PANE)}>
        {groups.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No cases here.</p>
        ) : (
          groups.map((g) => (
            <section key={g.id}>
              <h3 className="sticky top-0 z-20 bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
                {g.label}
              </h3>
              {/* gap-2 is the 8px between cards. px-3/pb-3 rather than 2
                  because the glass shadow reaches ~10px past the card edge and
                  the scroll viewport clips it. */}
              <ul className="flex flex-col gap-2 px-4 pb-3">
                {g.cases.map((c) => (
                  <li key={c.id}>
                    <CaseCard
                      case={c}
                      selected={c.id === selectedId}
                      onSelect={onSelect}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
