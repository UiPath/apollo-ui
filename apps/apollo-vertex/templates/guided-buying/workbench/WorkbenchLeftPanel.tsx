"use client";

// oxlint-disable max-lines -- the rail, the queue list, and the assistant
// slot's own animated width, kept together since they share one panel's
// open/collapse state (see the report).

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Inbox,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { sidebarSpring } from "@/registry/shell/shell-animations";
import { ShelfDock } from "../catalog/v1/ShelfDock";
import { getExceptionSummary, ph } from "../data";
import type { Exception } from "../data/exceptions";
import {
  applyExceptionOverrides,
  type Decision,
  FORK_DOT,
  FORK_LABEL,
  STATUS_LABEL,
  WORKBENCH_DETAILS,
  WORKBENCH_EXCEPTIONS,
  WORKBENCH_ROWS,
  type WorkbenchRow,
  type WorkbenchStatus,
} from "./data";

export type LeftPanelContent = "queue" | "assistant";

export interface LeftPanelState {
  open: boolean;
  content: LeftPanelContent;
}

// Matches QueueContent's and ShelfDock's own fixed panel width.
const PANEL_WIDTH_PX = 380;

/** Every request reachable from Sam's queue: assigned to him, with a detail
 * record to open. Unfiltered by status, the segmented control (below)
 * narrows it, not this. */
const QUEUE = WORKBENCH_ROWS.filter(
  (r) => r.assignee === "You" && WORKBENCH_DETAILS[r.id] != null,
);

const SEGMENTS: (WorkbenchStatus | "all")[] = [
  "all",
  "awaiting",
  "approved",
  "countered",
  "rejected",
  "auto-cleared",
];

type ExceptionOverrides = Record<
  string,
  Record<string, { status: Exception["status"]; waitingOn?: string }>
>;

/** A row's effective status: the seed's own `status`, overridden by this
 * session's decision if one was made, overridden again by "auto-cleared" if
 * every exception on the request has cleared on its own. Same three-part
 * derivation WorkbenchList.tsx's own table already uses for the identical
 * reason (see its own comment), so the queue's segments and the full list
 * never disagree about what counts as awaiting, decided, or cleared. */
function effectiveStatus(
  row: WorkbenchRow,
  decisions: Record<string, Decision>,
  exceptionOverrides: ExceptionOverrides,
): WorkbenchStatus {
  const seedExceptions = WORKBENCH_EXCEPTIONS[row.id];
  const summary = seedExceptions
    ? getExceptionSummary(
        applyExceptionOverrides(
          seedExceptions,
          exceptionOverrides[row.id] ?? {},
        ),
      )
    : null;
  const autoReleased =
    seedExceptions != null &&
    seedExceptions.length > 0 &&
    summary != null &&
    summary.openCount === 0 &&
    summary.waitingCount === 0;
  return autoReleased ? "auto-cleared" : (decisions[row.id] ?? row.status);
}

function QueueItem({
  id,
  onSelect,
  isActive,
}: {
  id: string;
  onSelect: (id: string) => void;
  isActive: boolean;
}) {
  const row = WORKBENCH_ROWS.find((r) => r.id === id);
  if (!row) return null;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="group w-full text-left"
    >
      <Card
        variant="glass"
        className={cn(
          "mx-4 gap-0 rounded-md px-3.5 py-3 transition-colors",
          isActive
            ? "ring-1 ring-primary"
            : "group-hover:bg-white/70 dark:group-hover:bg-white/[0.08]",
        )}
      >
        <div className="flex items-center justify-between gap-6">
          <span className="min-w-0 truncate text-[13px] font-semibold text-foreground">
            {row.request}
          </span>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {row.value}
          </span>
        </div>
        <div className="mt-[5px] flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <div
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                FORK_DOT[row.type],
              )}
            />
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              {FORK_LABEL[row.type]}
            </span>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            {row.id}
          </span>
        </div>
      </Card>
    </button>
  );
}

function NavSectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="px-4 pb-2 pt-4">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}{" "}
        <span className="font-normal tabular-nums text-muted-foreground/70">
          ({count})
        </span>
      </span>
    </div>
  );
}

function segmentLabel(segment: WorkbenchStatus | "all"): string {
  return segment === "all" ? "All" : STATUS_LABEL[segment];
}

/** The segmented state filter (prompt 32, narrowed in prompt 33): derived
 * from WorkbenchStatus, not ExceptionStatus. Picked WorkbenchStatus because
 * it's the field the queue's own rows are built from (`WorkbenchRow.status`);
 * ExceptionStatus describes one exception inside a request, not the request
 * itself, and a row can carry zero, one, or several exceptions at different
 * statuses, so "the" exception status of a row isn't a well-defined single
 * value to filter a row list by.
 *
 * A segment with no items is hidden, "all" excepted (always leading, per
 * prompt 32). Still fully derived: every render recomputes every segment's
 * count from the queue's own contents, so a hidden segment that gains an
 * item reappears on its own, nothing is precomputed or cached. `overflow-x
 * -auto` on the row is a backstop, not the chosen fix: hiding empty segments
 * already gets today's set (all, awaiting) down to one row on its own; the
 * scroll only matters if enough segments are non-empty at once to need it.
 * Reference treatment: the active segment appends its own count, the others
 * show their label alone. */
function QueueSegments({
  selected,
  onSelect,
  decisions,
  exceptionOverrides,
}: {
  selected: WorkbenchStatus | "all";
  onSelect: (segment: WorkbenchStatus | "all") => void;
  decisions: Record<string, Decision>;
  exceptionOverrides: ExceptionOverrides;
}) {
  const withCounts = SEGMENTS.map((segment) => ({
    segment,
    count:
      segment === "all"
        ? QUEUE.length
        : QUEUE.filter(
            (r) =>
              effectiveStatus(r, decisions, exceptionOverrides) === segment,
          ).length,
  }));
  const visible = withCounts.filter(
    ({ segment, count }) => segment === "all" || count > 0,
  );

  return (
    <div className="flex flex-nowrap gap-1 overflow-x-auto border-b border-border/50 px-3 py-2.5">
      {visible.map(({ segment, count }) => {
        const isActive = segment === selected;
        return (
          <button
            key={segment}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(segment)}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {segmentLabel(segment)}
            {isActive && <span className="ml-1 tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function QueueContent({
  activeId,
  onSelect,
  onCollapse,
  selectedSegment,
  onSelectSegment,
  decisions,
  exceptionOverrides,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onCollapse: () => void;
  selectedSegment: WorkbenchStatus | "all";
  onSelectSegment: (segment: WorkbenchStatus | "all") => void;
  decisions: Record<string, Decision>;
  exceptionOverrides: ExceptionOverrides;
}) {
  const filtered =
    selectedSegment === "all"
      ? QUEUE
      : QUEUE.filter(
          (r) =>
            effectiveStatus(r, decisions, exceptionOverrides) ===
            selectedSegment,
        );
  const dueToday = filtered.filter((r) => r.dueGroup === "today");
  const dueTomorrow = filtered.filter((r) => r.dueGroup === "tomorrow");
  const index = filtered.findIndex((r) => r.id === activeId);
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < filtered.length - 1;

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col overflow-hidden border-r border-border/60 bg-card">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/50 px-3">
        <span className="flex-1 truncate text-[13px] font-semibold">
          My queue{" "}
          <span className="font-normal tabular-nums text-muted-foreground">
            ({QUEUE.length})
          </span>
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onCollapse}
          aria-label="Close queue"
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <QueueSegments
        selected={selectedSegment}
        onSelect={onSelectSegment}
        decisions={decisions}
        exceptionOverrides={exceptionOverrides}
      />

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          // Inline and muted, not centred (prompt 39): this is a
          // placeholder for copy, not a designed empty state, so it takes
          // the same treatment as every other placeholder on this surface.
          // Rendered as its id plus a short label, not the full ruling
          // description (prompt 41).
          <p className="px-4 pt-4 text-xs text-muted-foreground">
            {ph("PH-38", "queue empty state")}
          </p>
        ) : (
          <>
            {dueToday.length > 0 && (
              <>
                <NavSectionLabel label="Due today" count={dueToday.length} />
                <div className="space-y-2 pb-2">
                  {dueToday.map((r) => (
                    <QueueItem
                      key={r.id}
                      id={r.id}
                      onSelect={onSelect}
                      isActive={r.id === activeId}
                    />
                  ))}
                </div>
              </>
            )}
            {dueTomorrow.length > 0 && (
              <>
                <NavSectionLabel
                  label="Due tomorrow"
                  count={dueTomorrow.length}
                />
                <div className="space-y-2 pb-2">
                  {dueTomorrow.map((r) => (
                    <QueueItem
                      key={r.id}
                      id={r.id}
                      onSelect={onSelect}
                      isActive={r.id === activeId}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-2.5">
        <button
          type="button"
          aria-label="Previous request"
          disabled={!hasPrev}
          onClick={() => hasPrev && onSelect(filtered[index - 1].id)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs tabular-nums text-muted-foreground">
          {index >= 0
            ? `${index + 1} of ${filtered.length}`
            : `0 of ${filtered.length}`}
        </span>
        <button
          type="button"
          aria-label="Next request"
          disabled={!hasNext}
          onClick={() => hasNext && onSelect(filtered[index + 1].id)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

interface WorkbenchLeftPanelProps {
  activeId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  panel: LeftPanelState;
  onRailClick: (content: LeftPanelContent) => void;
  onCollapse: () => void;
  selectedSegment: WorkbenchStatus | "all";
  onSelectSegment: (segment: WorkbenchStatus | "all") => void;
  decisions: Record<string, Decision>;
  exceptionOverrides: ExceptionOverrides;
}

/** One rail, one slot (prompt 32). The rail carries a queue item and an
 * assistant item; whichever is active is marked, and the slot beside it
 * holds that content, or nothing when collapsed. No pre-existing icon rail
 * lived on this screen (see the report), so this one is new, modeled on
 * RailDock.tsx's own collapsed-column treatment (64px, centred icon
 * buttons, border-r) for visual consistency with the assistant's own
 * established chrome elsewhere in this app.
 *
 * The assistant's own thread is scoped to this request: `ShelfDock` reads
 * `useAssistantThread()` from `AssistantThreadProvider`, mounted in
 * `WorkbenchDetail` (prompt 46, moved up from here) so the evidence chip
 * in the centre pane, a sibling of this whole panel, can post into the
 * same thread this panel renders. A thread survives collapsing and
 * reopening the panel within the same request; only a request change
 * (`WorkbenchDetail`'s own `key={openId}`, one level up) resets it.
 *
 * Both contents are mounted unconditionally too, visibility toggled by
 * `hidden` rather than by conditional rendering (prompt 33). `ShelfDock`
 * mounts its own `RailDock` internally with a grow-from-zero entrance
 * animation on every mount; conditionally rendering it meant every swap to
 * the assistant replayed that animation, reading as a collapse followed by
 * an open even though the panel's own `open` state never changed. Mounting
 * it once and hiding it with CSS keeps that animation to the first-ever
 * open, not every swap, without touching `ShelfDock`/`RailDock` themselves. */
export function WorkbenchLeftPanel({
  activeId,
  onSelect,
  onBack,
  panel,
  onRailClick,
  onCollapse,
  selectedSegment,
  onSelectSegment,
  decisions,
  exceptionOverrides,
}: WorkbenchLeftPanelProps) {
  const showQueue = panel.open && panel.content === "queue";
  const showAssistant = panel.open && panel.content === "assistant";
  return (
    <div className="flex h-full shrink-0">
      <div className="flex h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-border/60 bg-card pt-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to all requests"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="my-1 h-px w-6 shrink-0 bg-border" />
        <button
          type="button"
          aria-label="Queue"
          aria-pressed={showQueue}
          onClick={() => onRailClick("queue")}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
            showQueue
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Inbox className="size-4" />
        </button>
        {/* Inactive: bare, mark painted with the gradient itself. Active:
            the size-9 circle fills with it instead, mark going flat
            `text-background` to read against it. */}
        <button
          type="button"
          aria-label="Assistant"
          aria-pressed={showAssistant}
          onClick={() => onRailClick("assistant")}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
            !showAssistant && "hover:bg-muted",
          )}
          style={
            showAssistant ? { background: "var(--ai-gradient-strong)" } : {}
          }
        >
          <AiMark
            size={18}
            {...(showAssistant ? {} : { gradientId: "gb-ai-mark" })}
            className={cn(showAssistant && "text-background")}
            aria-hidden
          />
        </button>
      </div>

      {/* Same spring the shell sidebar collapses with. Animates to 0, not
          an icon rail like RailDock.tsx: that rail is the separate,
          always-visible column to the left. `AssistantThreadProvider`
          used to wrap just this motion.div (see the report), keyed to
          `activeId`; prompt 46 lifted it to `WorkbenchDetail`'s own top
          level, since the evidence chip (in the centre pane, a sibling of
          this whole panel) now needs to post into the same thread this
          panel renders. */}
      <motion.div
        initial={false}
        animate={{ width: panel.open ? PANEL_WIDTH_PX : 0 }}
        transition={sidebarSpring}
        className="h-full shrink-0 overflow-hidden"
      >
        <div className={showQueue ? "h-full" : "hidden"}>
          <QueueContent
            activeId={activeId}
            onSelect={onSelect}
            onCollapse={onCollapse}
            selectedSegment={selectedSegment}
            onSelectSegment={onSelectSegment}
            decisions={decisions}
            exceptionOverrides={exceptionOverrides}
          />
        </div>
        <div className={showAssistant ? "h-full" : "hidden"}>
          <ShelfDock
            subject={null}
            context="selection"
            starterQuestions={[]}
            onClose={onCollapse}
            onCorrectionMade={() => {
              // No correction surface wired for this finish-line context yet.
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
