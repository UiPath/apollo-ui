"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  Clock,
  FlaskConical,
  Info,
  Link as LinkIcon,
  PackageCheck,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { JourneyBar } from "../JourneyBar";
import { P2 } from "../P2";
import { getRequestDetail, STATUS_BADGE, STATUS_LABEL } from "./data";
import { useRequests } from "./requests-context";

// ─── Thread message bubble ────────────────────────────────────────────────────

function MessageBubble({
  text,
  timestamp,
}: {
  text: string;
  timestamp: string;
}) {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="max-w-[74%]">
        <div className="rounded-2xl rounded-br-sm bg-muted px-3.5 py-2.5 text-sm text-foreground">
          {text}
        </div>
        <p className="mt-1 text-right text-[10.5px] text-muted-foreground">
          {timestamp}
        </p>
      </div>
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-semibold text-primary">
        MW
      </div>
    </div>
  );
}

// ─── P2 nudge capsule — system event in the thread ───────────────────────────

function NudgeCapsule({ text }: { text: string }) {
  return (
    <div className="flex justify-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[10.5px] text-primary">
        <Bell className="size-3 shrink-0" aria-hidden />
        {text}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Full-page request detail at /requests/$id. Lifts all logic from PanelBody
 * (thread, urgent, send) — swaps Sheet chrome for a page header with back nav.
 */
export function RequestWindow() {
  const { id } = useParams({ from: "/requests/$id" });
  const navigate = useNavigate();
  const { threads, addNote, urgent, markUrgent } = useRequests();

  const [draft, setDraft] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const detail = getRequestDetail(id);

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Request not found.</p>
      </div>
    );
  }

  const notes = threads[id] ?? [];
  const isUrgent = urgent[id] === true;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    addNote(id, text);
    setDraft("");
  };

  // Badge label: use statusLabel override (e.g. "Pending · 2 days") or fall
  // through to the standard STATUS_LABEL for this request's status.
  const badgeLabel =
    detail.statusLabel ??
    // STATUS_LABEL indexed by headline as a fallback — kept loose for seeded data
    // that may not have a strict RequestStatus key.
    STATUS_LABEL[detail.headline as keyof typeof STATUS_LABEL] ??
    detail.headline;

  const badgeStatus = detail.statusLabel
    ? "warning"
    : (STATUS_BADGE[detail.headline as keyof typeof STATUS_BADGE] ?? "warning");

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-6 py-8 space-y-4">
        {/* ── Breadcrumb header ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void navigate({ to: "/requests" })}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Requests
          </button>
          <span className="text-muted-foreground/40" aria-hidden>
            /
          </span>
          <h1 className="text-sm font-semibold text-foreground">
            {detail.request}
          </h1>
          <Badge
            status={badgeStatus}
            variant="secondary"
            className="text-[10.5px]"
          >
            {badgeLabel}
          </Badge>
          {isUrgent && (
            <Badge
              status="error"
              variant="secondary"
              className="gap-1 text-[10.5px]"
            >
              <TriangleAlert className="size-3" aria-hidden />
              Urgent
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>{id}</span>
            {detail.inFlight && detail.approver != null && (
              <button
                type="button"
                onClick={() =>
                  void navigate({ to: "/decision/$id", params: { id } })
                }
                className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <FlaskConical className="size-3 shrink-0" aria-hidden />
                <span className="font-medium text-muted-foreground/50">
                  demo
                </span>
                <span aria-hidden className="text-muted-foreground/30">
                  ·
                </span>
                Approver view
              </button>
            )}
          </div>
        </div>

        {/* ── Agent line ────────────────────────────────────────────── */}
        <div className="flex gap-2.5 rounded-lg border bg-muted/40 px-3.5 py-3">
          <AiMark
            size={16}
            className="mt-0.5 shrink-0"
            gradientId="gb-ai-mark"
            aria-hidden
          />
          <p className="text-sm leading-[1.6] text-foreground">
            {detail.agentLine}
          </p>
        </div>
        {/* ── Journey card ──────────────────────────────────────────── */}
        {detail.journeyStages != null && (
          <>
            <div className="rounded-xl border bg-card px-4 py-3.5">
              <JourneyBar
                stages={detail.journeyStages}
                ownerNote={
                  detail.journeyOwnerNote != null ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3 shrink-0" aria-hidden />
                      {detail.journeyOwnerNote}
                    </span>
                  ) : undefined
                }
                recordChips={
                  detail.nudgeText != null ? (
                    <P2>
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-0.5 text-[10.5px] font-semibold text-primary">
                          <LinkIcon className="size-3 shrink-0" aria-hidden />
                          PR-2052
                        </span>
                        <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[10.5px] text-muted-foreground">
                          PO · created on approval
                        </span>
                      </>
                    </P2>
                  ) : undefined
                }
              />
            </div>
            {detail.hasClose && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    void navigate({ to: "/close/$id", params: { id } })
                  }
                  className="flex items-center gap-1 text-xs text-primary transition-colors hover:underline"
                >
                  <PackageCheck className="size-3.5 shrink-0" aria-hidden />
                  Delivery receipt
                </button>
              </div>
            )}
          </>
        )}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" aria-hidden />
          The output is AI generated. Please review.
        </p>

        {/* ── Summary strip ─────────────────────────────────────────── */}
        {detail.summary != null && (
          <div className="rounded-xl border bg-card px-4 py-2.5 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <span>
                <span className="font-medium text-foreground">Items</span>
                {" · "}
                {detail.summary.items}
              </span>
              <span>
                <span className="font-medium text-foreground">Total</span>
                {" · "}
                <strong className="text-foreground">
                  {detail.summary.total}
                </strong>
              </span>
              {detail.summary.needBy != null && (
                <span>
                  <span className="font-medium text-foreground">Need by</span>
                  {" · "}
                  {detail.summary.needBy}
                </span>
              )}
              {(detail.approver != null || detail.costCenter != null) && (
                <button
                  type="button"
                  onClick={() => setShowDetails((v) => !v)}
                  className="ml-auto text-xs text-primary transition-colors hover:underline"
                >
                  {showDetails ? "Less" : "Full details"}
                </button>
              )}
            </div>
            {showDetails && (
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-2">
                {detail.approver != null && (
                  <span>
                    <span className="font-medium text-foreground">
                      Approver
                    </span>
                    {" · "}
                    {detail.approver}
                  </span>
                )}
                {detail.costCenter != null && (
                  <span>
                    <span className="font-medium text-foreground">
                      Charged to
                    </span>
                    {" · "}
                    {detail.costCenter}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Conversation ──────────────────────────────────────────── */}
        <div className="rounded-xl border bg-card px-4 py-3.5">
          <p className="mb-3 text-[12.5px] font-semibold text-foreground">
            Conversation on this request
          </p>

          <div className="space-y-3">
            {/* Seed message — pre-populated from deck data */}
            {detail.threadSeedMessage != null && (
              <MessageBubble
                text={detail.threadSeedMessage}
                timestamp="You · 2:14 PM · Alex was notified"
              />
            )}

            {/* Dynamic notes posted in this session */}
            {notes.map((n) => (
              <MessageBubble
                key={n.id}
                text={n.text}
                timestamp={`${n.author} · ${n.time}`}
              />
            ))}

            {/* P2: system nudge capsule */}
            {detail.nudgeText != null && (
              <P2>
                <NudgeCapsule text={detail.nudgeText} />
              </P2>
            )}
          </div>

          {/* ── Actions ─────────────────────────────────────────────── */}
          {detail.inFlight ? (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              {isUrgent && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
                  <TriangleAlert
                    className="size-4 shrink-0 text-warning"
                    aria-hidden
                  />
                  <span className="text-foreground">
                    Marked urgent. Procurement has been notified.
                  </span>
                </div>
              )}

              {/* Composer — always visible, matches deck's persistent input */}
              <div className="space-y-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
                  }}
                  placeholder={`Message ${detail.agentLine.includes("Alex") ? "Alex" : "procurement"} about this request…`}
                  className="min-h-[72px] resize-none text-sm"
                />
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isUrgent ? "justify-end" : "justify-between",
                  )}
                >
                  {!isUrgent && (
                    <button
                      type="button"
                      onClick={() => markUrgent(id)}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Mark urgent
                    </button>
                  )}
                  <Button size="sm" disabled={!draft.trim()} onClick={send}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button size="sm" onClick={() => void navigate({ to: "/buy" })}>
                Reorder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void navigate({ to: "/catalog" })}
              >
                View order
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
