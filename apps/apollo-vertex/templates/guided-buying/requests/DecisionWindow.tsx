"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ChevronDown,
  History,
  Info,
  Link as LinkIcon,
  MoreHorizontal,
  Server,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Card, CardContent } from "@/components/ui/card";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderBackButton,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderField,
  PageHeaderFieldLabel,
  PageHeaderFieldValue,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { getDecisionDetail } from "./data";
import { RecordEntry } from "./RecordEntry";

/** Same soft-highlight treatment as the requester page's AI Summary — one
 * accent phrase, no evaluative language, the sentence still reads correctly
 * without the color. */
function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-sm px-1 text-insight-900 dark:text-insight-50"
      style={{
        backgroundImage: "var(--ai-gradient)",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
    >
      {children}
    </span>
  );
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// This scenario's fixed "today" — REQ-2052 was submitted Jul 21, 2026 and is
// already "2 days pending" as of this date elsewhere (RequestWindow/data.ts).
// Approving here keeps that same narrative clock rather than reading real
// wall-clock time, which would contradict the rest of the scenario.
const APPROVAL_DATE = "Jul 23, 2026";

/**
 * Approver decision view — /decision/$id. Chrome (header band, card
 * treatment, spacing, Communication entries) matches the requester's
 * Request Window; the shape doesn't. Alex isn't monitoring this over days
 * the way Marcus is — no stage track, no projected dates, no nudge/urgent,
 * no "where this stands" framing. This is a single reading path — summary,
 * what's in it, what the agent checked, what the requester said — ending
 * in one decision.
 */
export function DecisionWindow() {
  const { id } = useParams({ from: "/decision/$id" });
  const navigate = useNavigate();
  const [approved, setApproved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  // Captured from the composer at the moment Approve is clicked — the note
  // "left with the decision" (see the Communication entry below), not a
  // separate input of its own.
  const [approvalNote, setApprovalNote] = useState<string | null>(null);

  const detail = getDecisionDetail(id);

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Decision request not found.</p>
      </div>
    );
  }

  const requesterInitials = initialsOf(detail.requester);
  const approverFirstName = detail.approver.split(" · ")[0]!;
  const approverInitials = initialsOf(approverFirstName);
  const [shipLocation, shipAddress] = detail.shipTo.split(" · ");
  const [department, costCode] = detail.costCenter.split(" · ");

  // What the agent checked before routing this, and whether anything needs
  // attention — derived from the packet, not asserted. "Ready" here comes
  // straight from the itReview title, not a separate evaluative claim.
  const deviceStatus =
    detail.packet.itReview.title.split(" · ")[1]?.toLowerCase() ?? "reviewed";

  // Budget and device management restate in present tense once approved —
  // "after approval" was a projection; the request itself hasn't changed,
  // only whether it's still pending or already committed/enrolled.
  const budgetPctLabel = approved
    ? `${detail.packet.budget.pct} committed`
    : `${detail.packet.budget.pct} after approval`;
  const budgetDetail = approved
    ? detail.packet.budget.detail.replace("remaining", "committed")
    : detail.packet.budget.detail;
  const enrolledMatch = detail.packet.itReview.detail.match(/for (\d+ units)/);
  const deviceTitle = approved
    ? detail.packet.itReview.title.replace(/Ready$/, "Enrolled")
    : detail.packet.itReview.title;
  const deviceDetail =
    approved && enrolledMatch
      ? detail.packet.itReview.detail.replace(
          /^Enrollment pre-queued for \d+ units\./,
          `${enrolledMatch[1]} enrolled.`,
        )
      : detail.packet.itReview.detail;

  const communicationEntries = [
    {
      isPerson: true,
      name: detail.requester,
      initials: requesterInitials,
      timestamp: "2:14 PM",
      text: detail.note,
    },
    ...(approved
      ? [
          {
            isPerson: true,
            name: approverFirstName,
            initials: approverInitials,
            timestamp: "Just now",
            text:
              approvalNote != null
                ? `Approved. ${approvalNote}`
                : "Approved this request.",
          },
        ]
      : []),
  ];

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader bordered className="@3xl:!grid-cols-[auto_1fr_auto]">
        <PageHeaderNav>
          <PageHeaderBackButton
            onClick={() => void navigate({ to: "/requests" })}
          />
          <PageHeaderTitleGroup>
            <PageHeaderTitle>{id}</PageHeaderTitle>
            <PageHeaderDescription>{detail.request}</PageHeaderDescription>
          </PageHeaderTitleGroup>
        </PageHeaderNav>

        <PageHeaderContent className="@3xl:justify-between @3xl:pl-6">
          {/* Status — the one piece of state that changes on this page;
              lives in the header so it's visible without scrolling, since
              the confirmation itself is now a transient toast, not a
              persistent banner in the body. */}
          <PageHeaderField>
            <PageHeaderFieldLabel>Status</PageHeaderFieldLabel>
            <PageHeaderFieldValue>
              <Badge status={approved ? "success" : "warning"}>
                {approved ? "Approved" : "Pending decision"}
              </Badge>
            </PageHeaderFieldValue>
          </PageHeaderField>
          {/* Shows when the status changed — Status alone said what
              happened but not when. */}
          {approved && (
            <PageHeaderField>
              <PageHeaderFieldLabel>Approved</PageHeaderFieldLabel>
              <PageHeaderFieldValue>{APPROVAL_DATE}</PageHeaderFieldValue>
            </PageHeaderField>
          )}
          <PageHeaderField>
            <PageHeaderFieldLabel>Total</PageHeaderFieldLabel>
            <PageHeaderFieldValue>{detail.total}</PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField>
            <PageHeaderFieldLabel>Need by</PageHeaderFieldLabel>
            <PageHeaderFieldValue>{detail.needBy}</PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField>
            <PageHeaderFieldLabel>Requester</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="flex items-center gap-1.5">
              <Avatar className="size-[18px] shrink-0">
                <AvatarFallback className="bg-muted text-[8px] font-semibold text-muted-foreground">
                  {requesterInitials}
                </AvatarFallback>
              </Avatar>
              {detail.requester}
            </PageHeaderFieldValue>
          </PageHeaderField>
          {/* Charged to, not Approver — Alex doesn't need to be told he's
              the approver on his own decision view. */}
          <PageHeaderField>
            <PageHeaderFieldLabel>Charged to</PageHeaderFieldLabel>
            <PageHeaderFieldValue>{department}</PageHeaderFieldValue>
          </PageHeaderField>
        </PageHeaderContent>

        <PageHeaderActions className="@3xl:ml-6">
          <TooltipProvider>
            {(() => {
              const copyLink = () => {
                void navigator.clipboard.writeText(window.location.href);
                setMenuOpen(false);
              };

              // Shared between both trigger shapes below — only one ever
              // mounts, so reusing the same element is safe.
              const overflowContent = (
                <PopoverContent align="end" className="w-48 p-1">
                  {!approved && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex cursor-not-allowed">
                            <button
                              type="button"
                              disabled
                              className="pointer-events-none flex w-full items-center rounded-sm px-3 py-2 text-left text-sm font-medium text-muted-foreground/60"
                            >
                              Send back
                            </button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Not wired in this pass.</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex cursor-not-allowed">
                            <button
                              type="button"
                              disabled
                              className="pointer-events-none flex w-full items-center rounded-sm px-3 py-2 text-left text-sm font-medium text-destructive/60"
                            >
                              Reject
                            </button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Not wired in this pass.</p>
                        </TooltipContent>
                      </Tooltip>
                      <div className="my-1 h-px bg-border" />
                    </>
                  )}
                  <button
                    type="button"
                    className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={copyLink}
                  >
                    Copy link
                  </button>
                </PopoverContent>
              );

              if (!approved) {
                return (
                  <ButtonGroup>
                    <Button
                      onClick={() => {
                        setApproved(true);
                        // Whatever's still sitting in the composer becomes
                        // the note left with the decision (see the
                        // Communication entry below) rather than being
                        // silently discarded.
                        setApprovalNote(draft.trim() || null);
                        setDraft("");
                        // Confirms a completed action tied directly to this
                        // click, nothing further needed from Alex — a Sonner
                        // toast per the in-product notification guidelines,
                        // not a persistent banner. The Status field in the
                        // header carries the lasting record of the change.
                        toast.success("Approved", {
                          description: "The system will dispatch the order.",
                        });
                      }}
                    >
                      Approve
                    </Button>
                    <ButtonGroupSeparator className="bg-primary-600" />
                    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                      <PopoverTrigger asChild>
                        <Button aria-label="More actions">
                          <ChevronDown className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      {overflowContent}
                    </Popover>
                  </ButtonGroup>
                );
              }

              return (
                <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  {overflowContent}
                </Popover>
              );
            })()}
          </TooltipProvider>
        </PageHeaderActions>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 px-4 pt-8 pb-8 sm:px-6 lg:grid-cols-[1fr_260px] lg:gap-8 lg:px-8">
        {/* ── Main column — the reading path, top to bottom ────────────── */}
        <div className="min-w-0 space-y-5">
          {/* AI summary — answers the approver's question, not the
              requester's: what was checked, what (if anything) needs
              attention. One sentence, one accent phrase. */}
          <Card variant="glass" className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-1.5 text-base font-bold tracking-tighter text-foreground">
                <AiMark size={14} gradientId="gb-ai-mark" aria-hidden />
                AI Summary
              </div>
              <p className="mt-5 max-w-[640px] text-[23px] font-semibold leading-snug text-foreground">
                {approved ? (
                  <>
                    Now that you've approved it, I sent the purchase order to{" "}
                    {detail.supplier}, arriving by{" "}
                    <Highlight>{detail.expectedDelivery}</Highlight>.
                  </>
                ) : (
                  <>
                    Before this reached you, I confirmed device management is{" "}
                    {deviceStatus} and it lands at{" "}
                    <Highlight>
                      {detail.packet.budget.pct} of the hardware budget
                    </Highlight>{" "}
                    after approval, so nothing else needs your attention.
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card variant="glass" className="py-0">
            <CardContent className="space-y-1.5 p-5">
              {detail.lineItems.map((item) => (
                <div
                  key={item.description}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {item.description}
                  </span>
                  <span className="tabular-nums">{item.amount}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{detail.total}</span>
              </div>
            </CardContent>
          </Card>

          {/* Decision packet — budget and device management now share the
              same card treatment as line items, instead of two different
              tinted blocks that matched neither. */}
          <Card variant="glass" className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span>{detail.packet.budget.label}</span>
                <span>{budgetPctLabel}</span>
              </div>
              <div className="my-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: detail.packet.budget.pct }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{budgetDetail}</p>
            </CardContent>
          </Card>

          <Card variant="glass" className="py-0">
            <CardContent className="flex items-start gap-3 p-5">
              <Server
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {deviceTitle}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {deviceDetail}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Caveat — below all the AI-generated content above (summary,
              budget, device management), above everything else. */}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" aria-hidden />
            The output is AI generated. Please review.
          </p>

          {/* Communication — the requester's page's entry pattern (avatar,
              name, timestamp, message beneath), not a quoted card. A
              composer so Alex can ask before deciding, sitting below the
              record and visibly secondary (outline, not primary) to the
              decision group beneath it. */}
          <Card variant="glass" className="py-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-1.5 text-base font-bold tracking-tighter text-foreground">
                <History size={14} aria-hidden />
                Communication
                <span className="font-normal text-muted-foreground">
                  · {communicationEntries.length}
                </span>
              </div>
              <div className="mt-4 space-y-4">
                {communicationEntries.map((entry, i) => (
                  <RecordEntry
                    key={i}
                    isPerson={entry.isPerson}
                    name={entry.name}
                    initials={entry.initials}
                    timestamp={entry.timestamp}
                    text={entry.text}
                  />
                ))}
              </div>
              <div className="mt-5 space-y-2 border-t border-border pt-5">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Ask ${detail.requester.split(" ")[0]} a question before deciding`}
                  className="min-h-[64px] resize-none text-sm"
                />
                <div className="flex items-center justify-end">
                  <Button size="sm" variant="outline" disabled={!draft.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approve/Send back/Reject live in the header's action slot — a
              ButtonGroup with Approve leading, Send back and Reject in the
              overflow. Once decided there's nothing left to approve, so
              this replaces the whole group: a plain confirmation of what
              happened and the one thing left to do (look at the order),
              not a repeat of the toast that already fired once. */}
          {approved && (
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <p className="text-sm text-foreground">
                You approved this on {APPROVAL_DATE}.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void navigate({
                    to: "/po/$id",
                    params: { id: detail.poNumber },
                  })
                }
              >
                View order
              </Button>
            </div>
          )}
        </div>

        {/* ── Reference column — same unstyled labelled-list treatment as
            the requester page: no card, no border, just what's in it. */}
        <div className="w-full space-y-4 pt-5 lg:max-w-[260px]">
          <p className="text-base font-bold tracking-tighter text-foreground">
            Request details
          </p>
          <div>
            <p className="text-sm text-muted-foreground">Items</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {detail.lineItems.map((i) => i.description).join(", ")}
              <span className="font-normal text-muted-foreground">
                {" "}
                · {detail.total}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Supplier</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {detail.supplier}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ship to</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {shipLocation}
            </p>
            {shipAddress != null && (
              <p className="text-sm font-semibold text-foreground">
                {shipAddress}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Charged to</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {department}
            </p>
            {costCode != null && (
              <p className="text-sm font-semibold text-foreground">
                {costCode}
              </p>
            )}
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Linked records</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-0.5 text-[10.5px] font-semibold text-primary">
                <LinkIcon className="size-3 shrink-0" aria-hidden />
                PR-2052
              </span>
              {/* The PO doesn't exist until approval creates it — plain and
                  unlinked until then, a real linked record once it does. */}
              {approved ? (
                <button
                  type="button"
                  onClick={() =>
                    void navigate({
                      to: "/po/$id",
                      params: { id: detail.poNumber },
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-0.5 text-[10.5px] font-semibold text-primary"
                >
                  <LinkIcon className="size-3 shrink-0" aria-hidden />
                  {detail.poNumber}
                </button>
              ) : (
                <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[10.5px] text-muted-foreground">
                  PO · created on approval
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
