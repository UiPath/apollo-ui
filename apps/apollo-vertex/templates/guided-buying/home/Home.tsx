"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  Package,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AiChatEmptySuggestions } from "@/registry/ai-chat/components/ai-chat-empty-suggestions";
import { AiChatInput } from "@/registry/ai-chat/components/ai-chat-input";
import { useUser } from "@/registry/shell/shell-user-provider";
import { BuyScaffold } from "../catalog/v1/BuyScaffold";
import { useConversation } from "../catalog/v1/conversation-context";
import { CATALOG_STARTER, STARTER_SUGGESTIONS } from "../catalog/v1/data";
import { TeamsResumeCard } from "../catalog/v1/TeamsResumeCard";
import { P2 } from "../P2";
import {
  REQUEST_DETAILS,
  REQUEST_ROWS,
  type RequestDetail,
  type RequestRow,
  type RequestStatus,
  STATUS_LABEL,
} from "../requests/data";
import { useRequests } from "../requests/requests-context";
import { useTier } from "../tier-context";

// Same 6-line helper as BuyFlow's own (module-private there too) — not
// hoisted, since /buy stays untouched this pass. See the report.
function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// The composer fills with this on the laptops chip, then submits it — the
// actual requestText that ends up on Details (the Request row, the Need by
// popover's quoted phrase). Not the same string as the chip's own label or
// STARTER_SUGGESTIONS' bare value: this one reads as something a person
// typed, first person, since the audience watches it land before it submits.
const LAPTOPS_CHIP_TEXT = "I need 15 laptops for Fusion Event contractors";

/** What the requester owes, if anything — the row's inline action button.
 * Awaiting approval and the agent still working are someone/something
 * else's turn; only these two states put the ball back in the requester's
 * court. */
function ownedAction(
  row: RequestRow,
  detail: RequestDetail | undefined,
): string | null {
  if (row.status === "delivered") return "Confirm receipt";
  if (detail?.sentBack) return "Respond";
  return null;
}

// P1: factual status only, no first person. P2 (below): the same row's
// agent-voice line, appended, not swapped in. Home-specific copy — distinct
// from RequestWindow/MyRequestsList's own narrative fields, which serve a
// different surface with different wording needs.
const HOME_ROW_COPY: Record<string, { status: string; note: string }> = {
  "REQ-2031": {
    status: "Ordered from Ergotron. All 4 arrived.",
    note: "I ordered all 4 from Ergotron after Alex Chen approved.",
  },
  "REQ-2052": {
    status: "Pending with Alex Chen, 2 days.",
    note: "I sent this to Alex Chen and reminded him this morning.",
  },
  "REQ-2053": {
    status: "With procurement, sourcing.",
    note: "I drafted the RFQ, shortlisted vendors, and sent it to Sam Rivera.",
  },
  "REQ-2051": {
    status: "With procurement, pending approval.",
    note: "I configured the 12 lines under your T-Mobile MSA and sent it to Sam Rivera.",
  },
};

function homeRowCopy(row: RequestRow, detail: RequestDetail | undefined) {
  return (
    HOME_ROW_COPY[row.id] ?? {
      status: STATUS_LABEL[row.status],
      note: detail?.agentLine ?? "",
    }
  );
}

// One icon family (lucide, outline), one size, one color (text-muted) — the
// stage itself, never who or what supplier is holding it. That's named in
// the row's own subtitle text now, not encoded here.
const STAGE_ICON: Record<RequestStatus, typeof Package> = {
  ordered: Package,
  delivered: Package,
  approved: CheckCircle2,
  "pending-approval": Clock,
  sourcing: Search,
};

function updatedTime(dateStr: string): number {
  return new Date(dateStr).getTime();
}

/** Up to 4 rows: action-owed first, then most recently updated. Omitted
 * entirely by the caller when there are no requests at all. */
function RequestsSection({ rows }: { rows: RequestRow[] }) {
  const navigate = useNavigate();
  const sorted = [...rows].sort((a, b) => {
    const aOwed = ownedAction(a, REQUEST_DETAILS[a.id]) != null;
    const bOwed = ownedAction(b, REQUEST_DETAILS[b.id]) != null;
    if (aOwed !== bOwed) return aOwed ? -1 : 1;
    return updatedTime(b.updated) - updatedTime(a.updated);
  });
  const visible = sorted.slice(0, 4);
  const openRequest = (id: string) =>
    void navigate({ to: "/requests/$id", params: { id } });

  return (
    <div className="mx-auto mt-10 w-full">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Your requests</h2>
        <Link
          to="/requests"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          See all {rows.length}
        </Link>
      </div>
      <div className={cn(GLASS_CLASSES, "divide-y overflow-hidden rounded-xl")}>
        {visible.map((row) => {
          const detail = REQUEST_DETAILS[row.id];
          const action = ownedAction(row, detail);
          const copy = homeRowCopy(row, detail);
          const Icon = STAGE_ICON[row.status];
          // A <div> row, not a <button> — it holds the inline action as a
          // real nested <button> when one applies, and HTML can't nest
          // interactive controls. tabIndex/onKeyDown keep the whole row
          // keyboard-operable in its place.
          return (
            <div
              key={row.id}
              role="button"
              tabIndex={0}
              onClick={() => openRequest(row.id)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                openRequest(row.id);
              }}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.request}
                  </p>
                  {/* The one stage that earns emphasis on this screen — never
                      carried by the icon's color. */}
                  {row.status === "delivered" && (
                    <Badge
                      status="success"
                      variant="secondary"
                      className="shrink-0"
                    >
                      Ready to confirm
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {copy.status}
                </p>
                {/* Appended, not swapped in — the P1 line above still renders
                    in P2. */}
                <P2>
                  <p className="truncate text-xs text-muted-foreground">
                    {copy.note}
                  </p>
                </P2>
              </div>
              {action ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    openRequest(row.id);
                  }}
                >
                  {action}
                </Button>
              ) : (
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      {/* P2-only: P1 Home presents no agent-authored output, so there's
          nothing here for the caveat to disclose until P2 adds the note
          lines above. Same placement/treatment as Review's own caveat. */}
      <P2>
        <p className="flex items-center gap-1.5 px-1 pt-3 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" aria-hidden />
          The output is AI generated. Please review.
        </p>
      </P2>
    </div>
  );
}

/**
 * The requester landing — a centered composer (identical to /buy's Intake)
 * plus, beneath it, up to 4 of the requester's own requests. Submitting
 * (free text, Enter, or the laptops chip) seeds the conversation and jumps
 * straight to /buy's Details (bridge) step, the same request text becoming
 * the single source for that step's Request row and Need by popover. The
 * other two chips don't have a built Details step yet — see the report.
 */
export function Home() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { tier } = useTier();
  const [input, setInput] = useState("");
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const { submittedRows } = useRequests();
  const { sendCatalogRequest } = useConversation();
  // Same band as /buy's own Intake: the Teams-resume card sits fused above
  // the composer, P2 only, until dismissed.
  const showBand = tier === "p2" && !resumeDismissed;

  const seen = new Set<string>();
  const allRows = [...submittedRows, ...REQUEST_ROWS].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const greeting = `${timeOfDayGreeting()}, ${user?.first_name ?? "there"}.`;

  // Seeds the conversation with this exact text, then lands on the real,
  // addressable Details URL rather than a bare /buy — /buy?phase=bridge is
  // what lets BuyFlow's own mount effect skip its reset-on-arrival and keep
  // what was just seeded instead of overwriting it with the canonical demo
  // default (see the report).
  const submitToDetails = (text: string) => {
    sendCatalogRequest(text);
    void navigate({ to: "/buy", search: { phase: "bridge" } });
  };

  const handleSubmit = () => {
    const text = input.trim();
    if (!text) return;
    submitToDetails(text);
  };

  const handleChipSelect = (value: string) => {
    if (value !== CATALOG_STARTER) {
      // Q3 rebrand and the mobile-lines contract don't have a built Details
      // step in this prototype (they're separate, non-addressable phases) —
      // routing them here would land on intake, not a bridge. See the report.
      void navigate({ to: "/buy" });
      return;
    }
    // Fills first so the fill is visible, then submits a beat later.
    setInput(LAPTOPS_CHIP_TEXT);
    window.setTimeout(() => submitToDetails(LAPTOPS_CHIP_TEXT), 350);
  };

  return (
    <BuyScaffold
      stepKey="home"
      eyebrow={greeting}
      title="What can I get for you?"
      subtext={undefined}
      headerTitle=""
      assistantOpen={false}
      onOpenAssistant={() => {}}
    >
      <div className="mx-auto w-full">
        <P2>
          {!resumeDismissed && (
            <TeamsResumeCard
              // Re-sends as a new request; does not load a persisted draft —
              // same behavior as /buy's own Intake band.
              onResume={() => submitToDetails(CATALOG_STARTER)}
              onDismiss={() => setResumeDismissed(true)}
            />
          )}
        </P2>
        {/* The band sits directly above, inset 8px narrower with its own
            bottom shadow — a distinct layered piece, not fused to the
            composer's edges. */}
        <div className={cn(showBand && "relative z-10")}>
          <AiChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onStop={() => {}}
            isLoading={false}
            placeholder="Describe the item, quantity, and who it's for…"
            acceptedFileTypes="image/*,.pdf,.csv,.xlsx,.docx,.txt"
            // Flush with the requests card's edges below, rather than the
            // default inset meant for a composer that's the only thing on
            // screen (see the prop's own doc comment).
            embedded
          />
        </div>
        <AiChatEmptySuggestions
          suggestions={STARTER_SUGGESTIONS}
          onSelect={handleChipSelect}
        />
      </div>

      {allRows.length > 0 && <RequestsSection rows={allRows} />}
    </BuyScaffold>
  );
}
