"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
import {
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
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  type CollapsibleAction,
  PageHeader,
  PageHeaderActions,
  PageHeaderBackButton,
  PageHeaderCollapsibleActions,
  PageHeaderDescription,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { JourneyBar } from "../JourneyBar";
import { P2 } from "../P2";
import {
  getRequestDetail,
  getRequestRow,
  STATUS_BADGE,
  STATUS_LABEL,
} from "./data";
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
  const { threads, addNote, urgent, markUrgent, submittedRows } = useRequests();

  const [draft, setDraft] = useState("");

  const detail = getRequestDetail(id);
  // A request submitted this session (via the Buy flow) wins over the static
  // seed row for the same id — same precedence as the Requests list.
  const row = submittedRows.find((r) => r.id === id) ?? getRequestRow(id);

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Request not found.</p>
      </div>
    );
  }

  const notes = threads[id] ?? [];
  const isUrgent = urgent[id] === true;
  // The verbatim prompt for the sidebar's "Your request" field — a live
  // submission's captured text first, then a hand-seeded scenario's own
  // recorded prompt, falling back to the generated title when neither exists.
  const verbatimRequest =
    row?.prompt ?? detail.prompt ?? row?.request ?? detail.request;
  // Same precedence as `row.submitted`/`row.updated` above: a live session's
  // generated title (already what the Requests list shows) wins over the
  // static seed, so the two never disagree the way the old cart-derived
  // title used to.
  const displayTitle = row?.request ?? detail.request;
  const hasMessages =
    detail.threadSeedMessage != null ||
    notes.length > 0 ||
    detail.nudgeText != null;

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

  // Routed through PageHeaderCollapsibleActions rather than plain buttons: at
  // common laptop widths (~1280–1366px) two fixed-width buttons here forced
  // the actions grid column past its fair share, squeezing the title/badge
  // column enough to overlap the header fields beside it. The collapsible
  // measurer shrinks this column to just its overflow trigger when tight,
  // which frees that space back to the title and fields.
  const collapsibleActions = [
    detail.hasClose && {
      key: "delivery-receipt",
      button: (
        <Button
          key="delivery-receipt"
          variant="outline"
          size="sm"
          onClick={() => void navigate({ to: "/close/$id", params: { id } })}
        >
          <PackageCheck className="size-4" aria-hidden />
          Delivery receipt
        </Button>
      ),
      menuItem: (
        <DropdownMenuItem
          key="delivery-receipt"
          onClick={() => void navigate({ to: "/close/$id", params: { id } })}
        >
          <PackageCheck className="size-4" aria-hidden />
          Delivery receipt
        </DropdownMenuItem>
      ),
    },
    detail.inFlight &&
      detail.approver != null && {
        key: "approver-view",
        button: (
          <Button
            key="approver-view"
            variant="ghost"
            size="sm"
            onClick={() =>
              void navigate({ to: "/decision/$id", params: { id } })
            }
          >
            <FlaskConical className="size-4" aria-hidden />
            Approver view
            <span className="text-muted-foreground/60">(demo)</span>
          </Button>
        ),
        menuItem: (
          <DropdownMenuItem
            key="approver-view"
            onClick={() =>
              void navigate({ to: "/decision/$id", params: { id } })
            }
          >
            <FlaskConical className="size-4" aria-hidden />
            Approver view (demo)
          </DropdownMenuItem>
        ),
      },
  ].filter(Boolean) as CollapsibleAction[];

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader>
        <PageHeaderNav>
          <PageHeaderBackButton
            onClick={() => void navigate({ to: "/requests" })}
          />
          <PageHeaderTitleGroup>
            <div className="flex min-w-0 items-center gap-2">
              <PageHeaderTitle>{displayTitle}</PageHeaderTitle>
              <Badge
                status={badgeStatus}
                variant="secondary"
                className="shrink-0"
              >
                {badgeLabel}
              </Badge>
              {isUrgent && (
                <Badge
                  status="error"
                  variant="secondary"
                  className="shrink-0 gap-1"
                >
                  <TriangleAlert className="size-3" aria-hidden />
                  Urgent
                </Badge>
              )}
            </div>
            <PageHeaderDescription>
              Updated {row?.updated ?? "just now"}
            </PageHeaderDescription>
          </PageHeaderTitleGroup>
        </PageHeaderNav>

        <PageHeaderActions>
          <PageHeaderCollapsibleActions items={collapsibleActions} />
        </PageHeaderActions>
      </PageHeader>

      {/* Two columns: the narrative (agent line, journey, conversation) grows;
          the record — everything you'd look up rather than read — sits in a
          fixed sidebar. Stacks on narrow viewports. */}
      <div className="grid grid-cols-1 gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        {/* ── Main column ──────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          {/* Agent line */}
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

          {/* Journey card */}
          {detail.journeyStages != null && (
            <Card variant="glass">
              <CardContent className="px-4 py-3.5">
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
                />
              </CardContent>
            </Card>
          )}

          {/* Conversation — grows to fill the column; same caveat position
              and no terminal actions regardless of state (see sidebar). */}
          <Card variant="glass" className="flex-1">
            <CardContent className="flex h-full flex-col px-4 py-3.5">
              <p className="mb-3 text-[12.5px] font-semibold text-foreground">
                Conversation on this request
              </p>

              {hasMessages ? (
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
              ) : (
                <div className="flex flex-1 items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No messages yet.
                  </p>
                </div>
              )}

              {/* Caveat — identical slot in every state: below the thread
                  content, above (or here, beside) the composer. */}
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3.5 shrink-0" aria-hidden />
                The output is AI generated. Please review.
              </p>

              {/* Composer — inFlight only; terminal-state actions live in the
                  sidebar now, not here. */}
              {detail.inFlight && (
                <div className="mt-3 space-y-3 border-t border-border pt-4">
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

                  <div className="space-y-2">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                          send();
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar — the record ─────────────────────────────────────── */}
        <div className="space-y-4">
          <Card variant="glass">
            <CardContent className="space-y-3 px-4 py-3.5">
              <p className="text-[12.5px] font-semibold text-foreground">
                Request details
              </p>
              <div>
                <p className="text-xs text-muted-foreground">Request ID</p>
                <p className="text-sm font-medium text-foreground">{id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-sm font-medium text-foreground">
                  {row?.submitted ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-medium text-foreground">
                  {detail.summary?.total ?? "—"}
                </p>
              </div>
              {detail.summary?.needBy != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Need by</p>
                  <p className="text-sm font-medium text-foreground">
                    {detail.summary.needBy}
                  </p>
                </div>
              )}
              {detail.approver != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Approver</p>
                  <p className="text-sm font-medium text-foreground">
                    {detail.approver}
                  </p>
                </div>
              )}
              {detail.costCenter != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Charged to</p>
                  <p className="text-sm font-medium text-foreground">
                    {detail.costCenter}
                  </p>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Your request</p>
                <p className="text-sm text-foreground">{verbatimRequest}</p>
              </div>
            </CardContent>
          </Card>

          {/* Linked records — same P2 gate the journey card used to carry;
              moving the chips here just relocates that delta, doesn't drop it. */}
          {detail.nudgeText != null && (
            <P2>
              <Card variant="glass">
                <CardContent className="space-y-2 px-4 py-3.5">
                  <p className="text-[12.5px] font-semibold text-foreground">
                    Linked records
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-0.5 text-[10.5px] font-semibold text-primary">
                      <LinkIcon className="size-3 shrink-0" aria-hidden />
                      PR-2052
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[10.5px] text-muted-foreground">
                      PO · created on approval
                    </span>
                  </div>
                </CardContent>
              </Card>
            </P2>
          )}

          {/* Terminal-state actions */}
          {!detail.inFlight && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                className="w-full"
                onClick={() => void navigate({ to: "/buy" })}
              >
                Reorder
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
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
