"use client";

// oxlint-disable max-lines -- the 3-region escalation detail, adapted from the IP layout

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkle,
} from "lucide-react";
import { type PointerEvent, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type Decision,
  FORK_BADGE_STATUS,
  FORK_DOT,
  FORK_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
  type TimelineEntry,
  WORKBENCH_DETAILS,
  WORKBENCH_ROWS,
  type WorkbenchDetail as Detail,
  type WorkbenchStatus,
} from "./data";

type CenterView = "finding" | "comms";
type RightTab = "activity" | "details" | "lines" | "source";
type Resolution = Decision | null;

const REVIEWER_INITIALS = "PV";

// ── Left queue ────────────────────────────────────────────────────────────────

const QUEUE = WORKBENCH_ROWS.filter(
  (r) => r.assignee === "You" && WORKBENCH_DETAILS[r.id] != null,
);

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
      <div
        className={cn(
          "mx-4 rounded-md border bg-card px-3.5 py-3 transition-colors",
          isActive
            ? "border-[1.5px] border-primary"
            : "border-border group-hover:bg-muted/60",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {row.requester}
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
      </div>
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

function LeftQueue({
  activeId,
  onSelect,
  onBack,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const dueToday = QUEUE.filter((r) => r.dueGroup === "today");
  const dueTomorrow = QUEUE.filter((r) => r.dueGroup === "tomorrow");
  const index = QUEUE.findIndex((r) => r.id === activeId);
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < QUEUE.length - 1;

  return (
    <div className="relative flex h-full w-[300px] shrink-0 flex-col overflow-hidden border-r border-border/60">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border/50 px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to all requests"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
        </button>
        <span className="flex-1 truncate text-[13px] font-semibold">
          My queue{" "}
          <span className="font-normal tabular-nums text-muted-foreground">
            ({QUEUE.length})
          </span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
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
            <NavSectionLabel label="Due tomorrow" count={dueTomorrow.length} />
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
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-2.5">
        <button
          type="button"
          aria-label="Previous request"
          disabled={!hasPrev}
          onClick={() => hasPrev && onSelect(QUEUE[index - 1].id)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} of {QUEUE.length}
        </span>
        <button
          type="button"
          aria-label="Next request"
          disabled={!hasNext}
          onClick={() => hasNext && onSelect(QUEUE[index + 1].id)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ── Center: the finding + the call ────────────────────────────────────────────

function ResolvedAlert({
  detail,
  decision,
}: {
  detail: Detail;
  decision: Decision;
}) {
  const body = detail.confirmations[decision];
  if (decision === "rejected") {
    return (
      <Alert status="error">
        <AlertTitle>{STATUS_LABEL.rejected}</AlertTitle>
        <AlertDescription>{body}</AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert>
      <AlertTitle>{STATUS_LABEL[decision]}</AlertTitle>
      <AlertDescription>{body}</AlertDescription>
    </Alert>
  );
}

function Finding({
  detail,
  decision,
  onResolve,
}: {
  detail: Detail;
  decision: Resolution;
  onResolve: (d: Decision) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      <Badge
        status={FORK_BADGE_STATUS[detail.type]}
        variant="secondary"
        className="mb-4 rounded-[4px] px-2.5 py-[3px]"
      >
        {detail.finding.tag}
      </Badge>

      <h2 className="mb-4 max-w-[22ch] text-balance text-[28px] font-bold leading-[1.2] tracking-tight text-foreground">
        {detail.finding.headline}
      </h2>

      <div className="mb-4 grid max-w-[480px] grid-cols-3 divide-x divide-border [&>div:first-child]:pl-0">
        {detail.finding.metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-1.5 px-6 py-[18px]">
            <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {m.label}
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-[28px] font-semibold leading-none tracking-tight",
                m.cls,
              )}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>

      <p className="mb-6 max-w-[540px] text-[14px] leading-[1.7] text-muted-foreground">
        {detail.finding.body}
      </p>

      {decision ? (
        <ResolvedAlert detail={detail} decision={decision} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => onResolve(detail.actions.primary.decision)}>
            {detail.actions.primary.label}
          </Button>
          <Button
            variant="outline"
            onClick={() => onResolve(detail.actions.secondary.decision)}
          >
            {detail.actions.secondary.label}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onResolve(detail.actions.reject.decision)}
          >
            {detail.actions.reject.label}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Right reference panel ─────────────────────────────────────────────────────

function renderDot(indicator: TimelineEntry["indicator"]) {
  if (indicator === "pending")
    return (
      <div className="size-4 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
    );
  if (indicator === "user")
    return (
      <Avatar className="size-4 shrink-0">
        <AvatarFallback className="bg-muted-foreground text-[7px] font-bold text-white">
          {REVIEWER_INITIALS}
        </AvatarFallback>
      </Avatar>
    );
  if (indicator === "ai-warn")
    return (
      <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/20">
        <Sparkle
          className="size-2 text-amber-500"
          fill="currentColor"
          strokeWidth={0}
        />
      </div>
    );
  if (indicator === "ai-pass")
    return (
      <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/20">
        <Sparkle
          className="size-2 text-emerald-500"
          fill="currentColor"
          strokeWidth={0}
        />
      </div>
    );
  return (
    <div className="flex size-4 shrink-0 items-center justify-center">
      <div className="size-2 rounded-full bg-muted-foreground/50" />
    </div>
  );
}

function ActivityTab({
  detail,
  decision,
}: {
  detail: Detail;
  decision: Resolution;
}) {
  const [noteState, setNoteState] = useState<"default" | "input">("default");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<TimelineEntry[]>([]);

  // The decision posts a first-person Autopilot confirmation at the top.
  const resolved: TimelineEntry[] = decision
    ? [
        {
          id: "resolved",
          label: detail.confirmations[decision],
          time: "Just now",
          indicator: decision === "rejected" ? "ai-warn" : "ai-pass",
        },
      ]
    : [];

  const items = [...resolved, ...notes, ...detail.activity];

  const addNote = () => {
    const text = noteText.trim();
    if (!text) return;
    setNotes((prev) => [
      {
        id: `note-${prev.length}`,
        label: "You added a note",
        desc: text,
        indicator: "user",
      },
      ...prev,
    ]);
    setNoteText("");
    setNoteState("default");
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 pb-3 pl-5 pr-8 pt-5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="flex w-4 flex-col items-center">
                {renderDot(item.indicator)}
                {!isLast && (
                  <div className="my-1 min-h-[10px] w-px flex-1 bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-[28px]">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "text-[13px] font-medium leading-snug",
                      item.indicator === "pending"
                        ? "italic text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {item.label}
                  </p>
                  {item.time && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {item.time}
                    </span>
                  )}
                </div>
                {item.desc && (
                  <p className="mt-1 text-[12px] leading-[1.5] text-muted-foreground">
                    {item.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="shrink-0 pb-4 pl-5 pr-8">
        <Separator className="mb-2" />
        {noteState === "input" ? (
          <div className="flex flex-col gap-1.5">
            <Textarea
              autoFocus
              placeholder="Add a note…"
              className="min-h-[64px] resize-none text-xs"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex justify-end gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNoteState("default");
                  setNoteText("");
                }}
              >
                Cancel
              </Button>
              <Button size="sm" disabled={!noteText.trim()} onClick={addNote}>
                Save note
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNoteState("input")}
            className="group flex items-center gap-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-border group-hover:border-muted-foreground">
              <Plus className="size-3" />
            </span>
            Add a note…
          </button>
        )}
      </div>
    </div>
  );
}

function DetailsTab({ detail }: { detail: Detail }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <dl className="space-y-3">
        {detail.details.map((f) => (
          <div
            key={f.label}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="shrink-0 text-xs text-muted-foreground">
              {f.label}
            </dt>
            <dd className="text-right text-sm font-medium text-foreground">
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LinesTab({ detail }: { detail: Detail }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="w-full pb-2 pr-3 text-left font-medium text-muted-foreground">
              Description
            </th>
            <th className="px-3 pb-2 text-right font-medium text-muted-foreground">
              Qty
            </th>
            <th className="px-3 pb-2 text-right font-medium text-muted-foreground">
              Unit
            </th>
            <th className="pb-2 pl-3 text-right font-medium text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {detail.lines.map((line) => (
            <tr key={line.description} className="border-b border-border/50">
              <td className="py-3 pr-3 text-foreground">{line.description}</td>
              <td className="px-3 py-3 text-right tabular-nums">{line.qty}</td>
              <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                {line.unitPrice}
              </td>
              <td className="py-3 pl-3 text-right font-medium tabular-nums">
                {line.amount}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td colSpan={3} className="pt-3 pr-3 text-right font-semibold">
              Total
            </td>
            <td className="pt-3 pl-3 text-right font-semibold tabular-nums">
              {detail.linesTotal}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SourceTab({ detail }: { detail: Detail }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          {detail.source.filename}
        </p>
        <div className="space-y-1.5">
          {detail.source.lines.map((line, i) => (
            <p
              key={line}
              className={cn(
                "text-xs leading-relaxed",
                i === 0
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function RightPanel({
  detail,
  decision,
}: {
  detail: Detail;
  decision: Resolution;
}) {
  const [tab, setTab] = useState<RightTab>("activity");
  const [width, setWidth] = useState(380);

  function startResize(e: PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    function move(ev: globalThis.PointerEvent) {
      const next = startWidth - (ev.clientX - startX);
      setWidth(Math.min(640, Math.max(340, next)));
    }
    function up() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const tabs: { key: RightTab; label: string }[] = [
    { key: "activity", label: "Activity" },
    { key: "details", label: "Details" },
    { key: "lines", label: "Line items" },
    { key: "source", label: "Source" },
  ];

  return (
    <div
      className="relative flex h-full shrink-0 flex-col overflow-hidden border-l border-border"
      style={{ width: `${width}px` }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        onPointerDown={startResize}
        className="absolute left-0 top-0 z-20 h-full w-1.5 cursor-ew-resize transition-colors hover:bg-primary/30"
      />
      <div className="flex shrink-0 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 whitespace-nowrap py-3 text-xs font-medium transition-colors",
              tab === t.key
                ? "-mb-px border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        {tab === "activity" && (
          <ActivityTab detail={detail} decision={decision} />
        )}
        {tab === "details" && <DetailsTab detail={detail} />}
        {tab === "lines" && <LinesTab detail={detail} />}
        {tab === "source" && <SourceTab detail={detail} />}
      </div>
    </div>
  );
}

// ── Assembly ──────────────────────────────────────────────────────────────────

interface WorkbenchDetailProps {
  id: string;
  decision: Resolution;
  onDecide: (id: string, decision: Decision) => void;
  onBack: () => void;
  onSelect: (id: string) => void;
}

/** Three-region escalation detail: queue · the agent's work + the call · reference. */
export function WorkbenchDetail({
  id,
  decision,
  onDecide,
  onBack,
  onSelect,
}: WorkbenchDetailProps) {
  const [centerView, setCenterView] = useState<CenterView>("finding");

  const detail = WORKBENCH_DETAILS[id];
  if (!detail) return null;

  const status: WorkbenchStatus = decision ?? "awaiting";

  return (
    <div className="flex h-full min-h-0">
      <LeftQueue activeId={id} onSelect={onSelect} onBack={onBack} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold text-foreground">
                  {detail.request}
                </h1>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {detail.id}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {detail.requester} · {detail.value} · {detail.timing} · Assigned
                to you
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge
                status={FORK_BADGE_STATUS[detail.type]}
                variant="secondary"
                className="rounded-[4px]"
              >
                {FORK_LABEL[detail.type]}
              </Badge>
              <Badge status={STATUS_BADGE[status]} variant="secondary">
                {STATUS_LABEL[status]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Center / right split */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Quote|Contract / Comms toggle */}
            <div className="flex shrink-0 gap-1 border-b border-border px-4 pt-2">
              {(["finding", "comms"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCenterView(v)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium transition-colors",
                    centerView === v
                      ? "-mb-px border-b-2 border-foreground text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v === "finding" ? FORK_LABEL[detail.type] : "Comms"}
                </button>
              ))}
            </div>

            {centerView === "finding" ? (
              <Finding
                detail={detail}
                decision={decision}
                onResolve={(d) => onDecide(id, d)}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No messages yet.
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Start a thread with the requester or the vendor — replies land
                  here.
                </p>
              </div>
            )}
          </div>

          <RightPanel detail={detail} decision={decision} />
        </div>
      </div>
    </div>
  );
}
