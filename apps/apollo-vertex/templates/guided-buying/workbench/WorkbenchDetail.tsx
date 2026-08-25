"use client";

// oxlint-disable max-lines -- the 3-region escalation detail, adapted from the IP layout

import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  Info,
  MoreHorizontal,
  PanelRightOpen,
  Plus,
  TriangleAlert,
  User,
} from "lucide-react";
import { type ComponentProps, type PointerEvent, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderField,
  PageHeaderFieldLabel,
  PageHeaderFieldValue,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import {
  AgentSummary,
  type SummaryMark,
  SummaryMarkSpan,
} from "../AgentSummary";
import { AssistantThreadProvider } from "../catalog/v1/assistant-thread-context";
import { Caveat } from "../DecisionActionRow";
import {
  BASE_TIER_REFERENCE_UNIT,
  BASE_TIER_REFERENCE_VALUE,
  BENCHMARK_ADDITIONS,
  BENCHMARK_CONCLUSION_LINE,
  BENCHMARK_EVIDENCE,
  BENCHMARK_REASON_LINE,
  COMPARABLE_DEALS,
  DEVIATION_BAND_RELATION,
  DEVIATION_PCT,
  DEVIATION_PCT_SIGNED,
  DEVIATION_ROUTING_CONSEQUENCE,
  DEVIATION_VERDICT,
  type DraftMessage,
  type Exception,
  formatAnchoredTime,
  getExceptionSummary,
  getPerson,
  IDENTITY,
  MARKET_REFERENCES_LINE,
  openExceptions,
  PAYMENT_TERMS_SOURCES,
  type PersonId,
  ph,
  QUANTITY,
  RELEASE_RECORD,
  SUPPLIER_REPLY,
  type Suggestion,
  TIMELINE,
  TOTAL_CONTRACT_VALUE,
  UNIT_PRICE_VALUE,
} from "../data";
import {
  ExceptionEvidence,
  exceptionHeadline,
  PRICE_EXCEPTION_ID,
} from "../ExceptionEvidence";
import { useRequests } from "../requests/requests-context";
import { TruncatedSubtitle } from "../requests/TruncatedSubtitle";
import { StructuredTable, type StructuredTableProps } from "../StructuredTable";
import { CorrectionDraftModal } from "./CorrectionDraftModal";
import {
  applyExceptionOverrides,
  type Decision,
  type WorkbenchDetail as Detail,
  type DetailField,
  FORK_BADGE_STATUS,
  FORK_LABEL,
  req10482VisibleActivity,
  STATUS_BADGE,
  STATUS_LABEL,
  type TimelineEntry,
  WORKBENCH_DETAILS,
  WORKBENCH_EXCEPTIONS,
  WORKBENCH_ROWS,
  type WorkbenchStatus,
} from "./data";
import {
  type LeftPanelContent,
  type LeftPanelState,
  WorkbenchLeftPanel,
} from "./WorkbenchLeftPanel";

type CenterView = "finding" | "comms";
type RightTab = "activity" | "details" | "lines" | "source";
type Resolution = Decision | null;

const REVIEWER_INITIALS = "PV";

// ── Center: the exception surface ─────────────────────────────────────────────
// Leads the centre pane while a request has open exceptions (see the report
// on PH-27 to PH-33 for what this displaces and when). No status chip here
// any more (prompt 42): the reader is looking at the exception with its own
// decision controls beneath it, so it can only be open. The chip still does
// real work in `WorkbenchList.tsx`'s own Status column, scanning many rows
// at once, unchanged.

// MetricLabel/MetricColumn/DeviationScale/ExceptionFinding/
// PRICE_EXCEPTION_ID (Chunk C2): extracted to ../ExceptionEvidence.tsx, a
// shared component REQ-10482's decision page now also consumes for its own
// "view evidence" links (see the report) — imported above, not redefined
// here. Same markup, same data, moved rather than duplicated.

function suggestionLabel(suggestion: Suggestion): string {
  return suggestion.type === "accept" ? "Accept" : "Request correction";
}

// Flagging for review: named by the prompt, unresolved in behaviour (see
// PH-35). No-op until that's ruled on.
function handleFlagForReview() {
  // Intentionally empty, see PH-35.
}

// Sharing feedback on the agent's benchmark finding: named by the reference
// card, unresolved in behaviour (see PH-40). No-op until that's ruled on.
function handleShareFeedback() {
  // Intentionally empty, see PH-40.
}

// The decisive figure, highlighted inline rather than folded into plain
// prose (prompt 29), matching how the approver's own summary highlights
// its budget percentage. No targetField: there's no rail on this screen for
// it to scroll to, so the mark is a rendering treatment only, not
// interactive. Both numbers and the relation to the band are derived (see
// cockpit-10482.ts), never hardcoded to make the highlight easier to build.
// No band percentage here (prompt 35): the scale's own end label is the one
// place that figure still appears, so this states the relation without
// restating the number. The trailing period is its own character after the
// mark now (prompt 41: the highlight must not enclose terminal punctuation),
// pulled snug against it with a negative margin rather than left to sit in
// the gap the mark's own padding would otherwise leave (prompt 36's original
// concern, still true, just resolved the other way this time).
const DEVIATION_MARK: SummaryMark = {
  text: `${DEVIATION_PCT}% ${DEVIATION_BAND_RELATION} the band`,
};

// ── Evidence exchange (prompt 46) ───────────────────────────────────────────
// Rendered inline in the card's own disclosure (prompt 48), replacing
// prompt 46's assistant exchange: no question to invent an answer for, no
// separate panel at the far edge of the screen from the deviation it
// explains. EVIDENCE_QUESTION and its PH-43 placeholder are gone with it
// (see the report); the register only ever names a gap that still exists.

// The deals table's own row order (see the report): the three comparables
// are already seeded in ascending price order, so this order's own row
// (the highest of the four) sits last, continuing that same ascending
// read rather than being pinned to the top or bottom by convention alone.
// Its seat count and unit price come from the seed's own quantity and
// unit price, the same figures the metric cards above already show, not
// restated as a second literal. The descriptor was `IDENTITY.shortTitle`
// (prompt 46), the seed's own short name for this request, deliberately
// rather than an authored phrase matching the other rows' "Enterprise
// SaaS, tier" pattern (prompt 50 confirms that reasoning). What still
// changed here is only the label naming this row as the current order:
// that's wording no seed value carries, so it's a content ruling behind
// PH-44, not a name derived from the request the way the other three
// rows' names come from COMPARABLE_DEALS.
const DEALS_TABLE: StructuredTableProps = {
  caption: "Comparable deals",
  columns: [
    { key: "descriptor", label: "Deal", align: "left" },
    { key: "seats", label: "Seats", align: "right" },
    { key: "price", label: "Price/license/yr", align: "right" },
  ],
  rows: [
    ...COMPARABLE_DEALS.map((deal) => ({
      key: `${deal.descriptor}-${deal.seats}`,
      cells: {
        descriptor: deal.descriptor,
        seats: deal.seats.toLocaleString("en-US"),
        price: `$${deal.pricePerYear}`,
      },
    })),
    {
      key: "this-order",
      cells: {
        descriptor: ph("PH-44", "this order"),
        seats: QUANTITY.toLocaleString("en-US"),
        price: UNIT_PRICE_VALUE,
      },
      emphasized: true,
    },
  ],
};

// Name and note, neither a figure, both left aligned. `width` on the
// capability column (prompt 50): measured live, "Recording and
// transcription" (the longest value) needs 161px of text plus the cell's
// own 16px of padding, about 177px; `table-layout: auto` on a `w-full`
// table was handing it far more than that, stranding Note's own start
// well away from it. 180px keeps a few px of breathing room without
// giving back the width this was built to reclaim.
const CAPABILITIES_TABLE: StructuredTableProps = {
  caption: "What this order adds",
  columns: [
    {
      key: "capability",
      label: "Capability",
      align: "left",
      width: "w-[180px]",
    },
    { key: "note", label: "Note", align: "left" },
  ],
  rows: BENCHMARK_ADDITIONS.map((item) => ({
    key: item.capability,
    cells: { capability: item.capability, note: item.note },
  })),
};

// The disclosure's own market references line: no restated conclusion
// sentence ahead of it (prompt 48 lists three things, not four), since the
// card's own summary directly above already carries that judgment; the
// evidence beneath states what backs it, not the same sentence twice.
const MARKET_REFERENCES_TEXT = `${MARKET_REFERENCES_LINE}: ${BASE_TIER_REFERENCE_VALUE}${BASE_TIER_REFERENCE_UNIT}`;

// ── Terms comparison (prompt 51) ─────────────────────────────────────────────
// TERMS_TABLE (Chunk C2): moved to ../ExceptionEvidence.tsx alongside
// ExceptionFinding, since both are the same "finding" concept for the two
// different exception shapes, and REQ-10482's decision page needed the
// identical table for its own evidence overlay (see the report).

/** The agent's rationale and its evidence, for the price exception only:
 * the only one with a rationale template and evidence counts built (prompt
 * 21). Leads with the judgment (the premium's attribution and where the
 * deviation sits against the band), then the reason (the capabilities
 * added and the rate lock): prompt 29's restructure, dropping the seat
 * count, unit price, annual value, and base reference already shown on the
 * metric cards above.
 *
 * One merged evidence chip, not two (prompt 38): the source renders the
 * comparable deals and market references counts as a single chip, and at
 * this pane's width (max-w-540px) one chip reading "N comparable deals, N
 * market references" fits on one line as easily as two separate chips did,
 * so there's no legibility reason to keep them apart. The chip itself now
 * opens the benchmark evidence view (prompt 43, `onSelect` rather than an
 * inline `detail` expansion) instead of expanding the comparables array
 * concatenated into a run on sentence; the separate PH-39 link that used
 * to sit beside it is gone too, since a chip and a link to the same
 * destination were two affordances for one thing.
 *
 * This now leads the pane, directly under the headline (prompt 35), so its
 * own top margin comes entirely from the headline's bottom margin; no
 * separate one here. No "AI summary" label any more (prompt 37), and the
 * mark itself moved inline (prompt 38, see the report): it used to sit
 * alone above this paragraph where the label once was, which orphaned it
 * once the label's own text was gone. The source places it inline at the
 * start of the sentence, marking the prose rather than floating above it,
 * so it renders as the conclusion's own first inline element now.
 *
 * Typography matches the approver pane's own body paragraph exactly
 * (prompt 37, see `Finding` below for the reference: `text-[14px]
 * leading-[1.7] text-muted-foreground`), set via `AgentSummary`'s
 * `conclusionClassName` (see AgentSummary.tsx for why this has to live on
 * the shared component's own `<p>` rather than a nested span). Additive
 * and optional on `AgentSummary`, so the approver view, which doesn't pass
 * it, is unaffected.
 *
 * `whitespace-nowrap` on the mark (prompt 36) keeps it from breaking mid
 * phrase at this pane's width, confirmed live (see the report); it's short
 * enough to always fit on a line of its own if it doesn't fit the current
 * one.
 *
 * The actions, the caveat, and a feedback link close this block, matching
 * the AI toolkit's own "suggested next step" card composition: the accept
 * and flag-for-review buttons are what to do about this specific agent
 * finding, not a pane-level decision, so they now render inside the card
 * that produced them rather than below it (previously in `ExceptionActions`
 * called from `ExceptionSurface`'s own Group 3; still the same component,
 * just called from here for the price exception). The terms exception has
 * no summary card, so `ExceptionSurface` still renders `ExceptionActions`
 * directly for it, unchanged. Still the shared `Caveat` component (see
 * DecisionActionRow.tsx), just called directly here rather than through
 * `DecisionActionRow`'s own row, so this can't affect where the approver
 * pane's own caveat renders (see the report on how that was verified).
 *
 * Share feedback sits opposite the caveat, on the same row: named by the
 * reference card, a no-op behind PH-40 since no destination exists yet.
 * Plain muted text, not link styled: a no-op placeholder isn't a link to
 * anything yet, so it shouldn't look like one, even though the reference
 * renders it as a link. */
/** The evidence disclosure's own trigger: a badge (prompt 47), then a
 * filled AI button (prompt 49), now a text link (prompt 52), each step
 * quieter than the last as the reason for the affordance moved: a badge
 * reads as status, a filled button competes with the primary action right
 * beneath it, and by this point the card already marks itself as agent
 * content twice over (the label's own mark, the summary's own framing), so
 * a third mark here would be redundant, not reinforcing. `Button`'s own
 * `link` variant (`text-primary`, no fill, no border, no background, see
 * `app/components/button/page.mdx`) is the toolkit's existing primitive
 * for exactly this, not something built by hand; `underline` is added
 * explicitly since `link`'s own default only underlines on hover, and
 * this needs to read as a link at rest, not only once touched. No hand
 * added hover, pressed, or focus styling beyond that: `Button`'s own
 * variant still carries all three.
 *
 * Nested inside `CollapsibleTrigger asChild` at the call site (prompt 48,
 * unchanged here): Radix's own trigger clones its child, merging in
 * `aria-expanded`, `aria-controls`, `data-state`, and its own click
 * handling. `...props` below is where that merge lands; `Button` already
 * forwards it to the real `button` element on its own (the same pattern
 * it uses for its own `asChild`), so nothing extra is needed here to wire
 * the disclosure up. That's the expanded state exposed to assistive
 * technology; the chevron is the same state's visible echo, not a second
 * source of truth for it. */
// Exported for prompt 94: the CoE finding detail reuses this exact chip
// for its own evidence, rather than a second copy of the same treatment.
export function EvidenceDisclosureTrigger({
  label,
  expanded,
  ...props
}: {
  label: string;
  expanded: boolean;
} & ComponentProps<"button">) {
  return (
    <Button variant="link" size="sm" className="h-auto p-0" {...props}>
      <span className="underline underline-offset-4">{label}</span>
      <ChevronDown
        className={cn(
          "size-3.5 shrink-0 transition-transform",
          expanded && "rotate-180",
        )}
        aria-hidden
      />
    </Button>
  );
}

function ExceptionAgentSummary({
  exception,
  onAccept,
  onOpenDraft,
}: {
  exception: Exception;
  onAccept: (exceptionId: string) => void;
  onOpenDraft: (exceptionId: string, draft: DraftMessage) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const evidenceLabel = `${COMPARABLE_DEALS.length} comparable deals, ${BENCHMARK_EVIDENCE.marketReferences} market references`;
  return (
    <div className="relative mb-6">
      <AiGlow />
      <Card
        variant="glass"
        className="relative bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]"
      >
        <CardContent>
          {/* 1. Label: agent mark + wording, in the accent colour (prompt
              41). Reinstated per the reference anatomy; its wording is a
              content ruling, so it renders the placeholder itself rather
              than authored copy. */}
          <div className="flex items-center gap-1.5">
            <AiMark size={14} gradientId="gb-ai-mark" aria-hidden />
            <span
              className="text-sm font-semibold tracking-tight"
              style={{
                backgroundImage: "var(--ai-gradient-text)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {ph("PH-41", "card label")}
            </span>
          </div>
          {/* 2. Body: the conclusion, and the disclosure that expands its
              evidence in place (prompt 48), directly beneath the summary
              it supports rather than at the opposite edge of the screen. */}
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <AgentSummary
              conclusionClassName="mt-2 text-[14px] font-normal leading-[1.7] text-muted-foreground"
              conclusion={
                <>
                  {BENCHMARK_CONCLUSION_LINE},{" "}
                  <SummaryMarkSpan
                    mark={DEVIATION_MARK}
                    className="whitespace-nowrap"
                  />
                  <span className="-ml-1">.</span> {BENCHMARK_REASON_LINE}
                </>
              }
              evidence={
                <CollapsibleTrigger asChild>
                  <EvidenceDisclosureTrigger
                    label={evidenceLabel}
                    expanded={expanded}
                  />
                </CollapsibleTrigger>
              }
            />
            {/* Comparable deals (this order emphasised as its own row),
                the market references line, then the capabilities and
                their notes: exactly what prompt 46's assistant exchange
                carried, minus its own restated conclusion line, since the
                summary above already states that judgment once. Columns
                at this card's own width (prompt 48, see the report); the
                table component falls back to its stacked variant
                (prompt 47) on its own if that width ever narrows.
                Grouped with the market references line so the gap
                binding it to the deals table above (space-y-1.5) is
                tighter than the gap to the next section's own heading
                below (space-y-6 on this element's own parent, prompt
                50): the line is a caption on the deals table, not an
                introduction to what follows it. */}
            <CollapsibleContent className="mt-4 space-y-6 border-t border-border/60 pt-4">
              <div className="space-y-1.5">
                <StructuredTable {...DEALS_TABLE} />
                <p className="text-[11px] text-muted-foreground">
                  {MARKET_REFERENCES_TEXT}
                </p>
              </div>
              <StructuredTable {...CAPABILITIES_TABLE} />
            </CollapsibleContent>
          </Collapsible>
          {/* 3. Action row: primary, secondary, and (exception-dependent)
              an overflow, all inside `ExceptionActions` now (prompt 41). */}
          <div className="mt-4">
            <ExceptionActions
              exception={exception}
              onAccept={onAccept}
              onOpenDraft={onOpenDraft}
            />
          </div>
          {/* 4. Footer: caveat left, feedback link right, one row. */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <Caveat />
            <button
              type="button"
              onClick={handleShareFeedback}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              {ph("PH-40", "share feedback")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** The active exception's decision controls: primary (the exception's own
 * suggestion, accept or request correction), secondary (flag for review,
 * unwired), and an overflow for anything beyond those two (prompt 41,
 * matching the reference anatomy's primary/secondary/overflow grammar).
 * Today only the payment terms exception has a third action (requesting a
 * formal term exception, PH-34), so the overflow trigger renders only for
 * it; the price exception has two actions and no overflow at all.
 *
 * PH-35 (flag for review) is an affordance placeholder, not a content one
 * (prompt 41): its behaviour, not just its wording, is unresolved, so the
 * button's own label is the placeholder rather than a real label with a
 * separate footnote describing the gap underneath it. Same treatment as
 * PH-34's own menu item below.
 *
 * Filled, then outlined, the same two variants in the same order the
 * approver pane's own first two actions use (prompt 37, see `Finding`
 * below for the reference). Plain flex row, not `DecisionActionRow`: that
 * component's own caveat-beside-actions layout doesn't apply once the
 * caveat attaches to agent produced prose instead of sitting beside these
 * buttons (prompt 39). */
function ExceptionActions({
  exception,
  onAccept,
  onOpenDraft,
}: {
  exception: Exception;
  onAccept: (exceptionId: string) => void;
  onOpenDraft: (exceptionId: string, draft: DraftMessage) => void;
}) {
  if (exception.suggestions.length === 0) return null;
  const [primary] = exception.suggestions;
  const hasOverflow = exception.type === "operational";

  function handlePrimary(suggestion: Suggestion) {
    if (suggestion.type === "accept") onAccept(exception.id);
    else onOpenDraft(exception.id, suggestion.draft);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => handlePrimary(primary)}>
        {suggestionLabel(primary)}
      </Button>
      <Button variant="outline" onClick={handleFlagForReview}>
        {ph("PH-35", "flag for review")}
      </Button>
      {hasOverflow && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="More actions"
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={handleTermExceptionRequest}>
              {ph("PH-34", "request term exception")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/**
 * The active exception: status, headline, finding, fix card. Paging (prev,
 * next, position) renders only when more than one exception is open; the
 * position text derives from `openList`/the local cursor, nothing counted
 * or labelled by hand. The third action for a payment terms exception
 * (source material offers requesting a formal term exception) lives in
 * `ExceptionActions`'s own overflow control now (prompt 41), behind
 * PH-34: its behaviour is unresolved, so it's registered and left unwired
 * rather than guessed.
 */
function handleTermExceptionRequest() {
  // Requesting a payment term exception: named by the prompt, unresolved in
  // behaviour (see PH-34). No-op until that's ruled on.
}

function ExceptionSurface({
  openList,
  onAccept,
  onOpenDraft,
}: {
  openList: Exception[];
  onAccept: (exceptionId: string) => void;
  onOpenDraft: (exceptionId: string, draft: DraftMessage) => void;
}) {
  const [cursor, setCursor] = useState(0);
  const activeIndex = Math.min(cursor, Math.max(openList.length - 1, 0));
  const active = openList[activeIndex];
  const hasPaging = openList.length > 1;

  if (!active) return null;

  const isPrice = active.id === PRICE_EXCEPTION_ID;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      {/* Group one: what this is (prompt 42, prior prompt 40). Paging,
          headline (now carrying the verdict), metrics, and the scale when
          it renders. The status chip that used to sit beside paging is
          gone (prompt 42): the reader is looking at the exception with its
          own decision controls beneath it, so it can only be open, unlike
          the queue row, where a chip does real work scanning many rows at
          once (`WorkbenchList.tsx`'s own Status column, unchanged). */}
      <div className="mb-6">
        {hasPaging && (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs tabular-nums text-muted-foreground">
              Exception {activeIndex + 1} of {openList.length}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous exception"
                disabled={activeIndex === 0}
                onClick={() => setCursor((c) => Math.max(0, c - 1))}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next exception"
                disabled={activeIndex === openList.length - 1}
                onClick={() =>
                  setCursor((c) => Math.min(openList.length - 1, c + 1))
                }
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* The headline now carries the verdict (prompt 42), one line,
            matching how the approver's own headlines read as a conclusion
            (e.g. "Configured under your T-Mobile MSA, ready to approve",
            see `Finding`'s own seed rows). `exceptionHeadline` (Chunk C2,
            extracted to ../ExceptionEvidence.tsx) composes this at render
            time from the same live derived verdict, so it still flips if
            the deviation crosses the band; the terms exception has no
            equivalent graduated check, so its headline renders alone, no
            trailing comma or empty clause. */}
        <h2 className="max-w-[26ch] text-balance text-[28px] font-bold leading-[1.2] tracking-tight text-foreground">
          {exceptionHeadline(active)}
        </h2>

        {/* The finding itself: the price exception's own metrics grid and
            deviation scale, or the terms exception's three-source table
            (prompt 51). Extracted (Chunk C2) to ../ExceptionEvidence.tsx,
            a shared component REQ-10482's decision page also renders for
            its own "view evidence" links — same markup, same data, one
            definition. */}
        <div className="mt-4">
          <ExceptionEvidence exception={active} />
        </div>
      </div>

      {/* Group two: what the agent found, and what to do about it. The
          summary, its evidence, the accept/flag actions, the caveat, and a
          feedback link, together on the AI card: the actions are the
          agent's own suggested next step, not a pane-level decision, so
          they render inside the card that produced them rather than below
          it (prompt: use the AI toolkit's card (primary) pattern). Price
          exception only: the terms exception has no summary or evidence of
          its own, so this group doesn't render for it at all rather than
          rendering empty (see the report); its actions render from Group
          three instead, below. */}
      {isPrice && (
        <ExceptionAgentSummary
          exception={active}
          onAccept={onAccept}
          onOpenDraft={onOpenDraft}
        />
      )}

      {/* Group three: what to do, for exceptions with no AI card (prompt
          40). The terms exception's own caveat and actions (including its
          overflow, prompt 41) render here, since it has no group two to
          attach them to; the price exception's actions and caveat live
          inside its Group two card instead, so this group only adds the
          routing note for it. */}
      <div className="mb-6">
        {!isPrice && (
          <>
            <Caveat className="mb-4" />
            <ExceptionActions
              exception={active}
              onAccept={onAccept}
              onOpenDraft={onOpenDraft}
            />
          </>
        )}

        {/* The note's own condition clause is gone (prompt 42): it repeated
            the headline's own verdict once the two joined. Only the
            consequence renders, regardless of the scale (prompt 39): it
            matters whether or not the position is close enough to the band
            to draw. */}
        {isPrice && (
          <p className="text-xs text-muted-foreground">
            {DEVIATION_ROUTING_CONSEQUENCE}
          </p>
        )}
      </div>
    </div>
  );
}

// Sam Rivera, the only buyer this prototype seats at the workbench. No
// shared constant exists for "the current user" elsewhere in this file
// (every other site inlines the same "sam-rivera" literal); named here
// once so the person-resolved row below can tell itself apart from
// someone else resolving it.
const CURRENT_USER_ID: PersonId = "sam-rivera";

function resolutionTime(when: Date | string): string {
  return typeof when === "string" ? when : formatAnchoredTime(when);
}

function msOf(when: Date | string): number {
  return typeof when === "string" ? Date.parse(when) : when.getTime();
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Approvals.tsx's formatElapsed / ActivityTrack.tsx's dateText are the
// only other elapsed-time formatters in this codebase: spelled-out unit
// words, singular/plural via a trailing "s", collapsed to the single
// largest whole unit rather than a multi-unit breakdown. Matched here
// rather than inventing a second convention.
function formatDuration(fromMs: number, toMs: number): string {
  const minutes = Math.floor((toMs - fromMs) / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** A resolved exception's own detail: second person with a timestamp when
 * the current user is who resolved it, third person naming them
 * otherwise, or a document's own version plus what happened to it and
 * when, tagged rather than read out of a string, per the model's own
 * distinction (see the report). Document resolution reads as an actual
 * re-run, not just receipt of a corrected file: TIMELINE carries a
 * distinct "revalidated" event ("Re-validated, checks re-run", actor
 * "agent") separate from the document's own arrival
 * ("order-form-v2-received"), so "cleared on re-validation" is what the
 * runtime evidences, not an asserted action nothing backs. The two rows
 * stay deliberately unlike each other: a person resolving it is
 * personal, a document arriving is not. */
function exceptionResolutionDetail(exception: Exception): string {
  const resolution = exception.resolution;
  if (!resolution) return "";
  if (resolution.resolvedBy === "person") {
    const time = resolutionTime(resolution.when);
    return resolution.by === CURRENT_USER_ID
      ? `You resolved this at ${time}`
      : `Resolved by ${getPerson(resolution.by).name} at ${time}`;
  }
  return `Corrected document ${resolution.by}, cleared on re-validation at ${resolutionTime(resolution.when)}`;
}

/** Initials for an avatar fallback: the same first-letter-per-word
 * derivation `DecisionWindow.tsx` already uses for the identical purpose,
 * not a shared export since this is the only place in this file that
 * needs one. */
function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * The auto-release completion state: renders once every exception on the
 * request is resolved, none open, none waiting. Leads with the outcome
 * (the contract, and how long it took), not the automation that produced
 * it: the banner's own headline states what Sam secured, its sub-line
 * carries the automation claim. Everything here is RELEASE_RECORD
 * (../data/cockpit-10482.ts), PAYMENT_TERMS_SOURCES/deviation exports, or
 * the exceptions' own resolution field, nothing authored beyond the
 * sentence templates themselves. Four beats, not the outcome restated
 * over and over: the banner states what happened, the two cards state
 * what changed, the resolved rows state what backed it, and Next step
 * states what's left, each said once. No approve, accept, or confirm
 * control appears here, this is a record of what already happened
 * automatically.
 */
function AutoReleaseCompletion({ exceptions }: { exceptions: Exception[] }) {
  const elapsed = formatDuration(
    msOf(TIMELINE[0].when),
    msOf(RELEASE_RECORD.when),
  );
  const originalTerms = PAYMENT_TERMS_SOURCES.find(
    (s) => s.check === "deviates",
  )?.terms;
  const correctedTerms = PAYMENT_TERMS_SOURCES.find(
    (s) => s.check === "governing",
  )?.terms;
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      <div className="max-w-[560px] space-y-6">
        {/* Block 1: outcome, what Sam secured and how long it took. The
          automation claim moved to the sub-line: it belongs on this
          screen, not as its headline. */}
        <Alert status="success" visual="tinted" className="py-2.5">
          <CheckCircle2 />
          <AlertTitle>
            {formatUSD(TOTAL_CONTRACT_VALUE)} contract released in {elapsed}
          </AlertTitle>
          <AlertDescription>
            Both exceptions resolved, released without a manual step.
          </AlertDescription>
        </Alert>

        {/* Block 2: what changed, one card per exception's own outcome. */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">Terms</p>
              <p className="text-sm font-medium text-foreground">
                {originalTerms} corrected to {correctedTerms}
              </p>
              <p className="text-xs text-muted-foreground">
                Matches {IDENTITY.agreement}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-sm font-medium text-foreground">
                {DEVIATION_PCT_SIGNED} {DEVIATION_VERDICT}
              </p>
              <p className="text-xs text-muted-foreground">
                {DEVIATION_BAND_RELATION === "within"
                  ? "Accepted, no escalation"
                  : "Escalated"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Block 3: evidence, one row per resolved exception. */}
        <div>
          <div className="divide-y divide-border">
            {exceptions.map((exception) => {
              const byPerson = exception.resolution?.resolvedBy === "person";
              return (
                <div
                  key={exception.id}
                  className="flex items-start gap-2 py-2.5"
                >
                  {byPerson ? (
                    <User
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  ) : (
                    <FileCheck
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <p className="text-sm leading-relaxed">
                    <span className="text-foreground">
                      {exception.headline}
                    </span>{" "}
                    <span className="text-xs text-muted-foreground">
                      · {exceptionResolutionDetail(exception)}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Block 4: next step, the one actionable item. */}
        <div className="border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">Next step</p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar className="size-9 shrink-0">
              <AvatarFallback className="bg-accent text-sm font-medium text-accent-foreground">
                {initialsOf(RELEASE_RECORD.nextStepOwner.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-foreground">
                {RELEASE_RECORD.nextStep.label}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {RELEASE_RECORD.nextStepOwner.name} ·{" "}
                {RELEASE_RECORD.nextStepOwner.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResolvedAlert({
  detail,
  decision,
}: {
  detail: Detail;
  decision: Decision;
}) {
  const body = detail.confirmations[decision];
  const title = detail.resolvedTitles?.[decision] ?? STATUS_LABEL[decision];
  if (decision === "rejected") {
    return (
      <Alert status="error">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{body}</AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
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
  const { primary, secondary, reject } = detail.actions;
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
            <span className="text-[10px] font-semibold uppercase leading-snug tracking-widest text-muted-foreground">
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

      {/* Sourcing: how the shortlist was assembled + the vendors (estimates). */}
      {detail.shortlist && (
        <div className="mb-6 max-w-[560px] space-y-2">
          {detail.shortlistNote && (
            <p className="text-xs leading-[1.6] text-muted-foreground">
              {detail.shortlistNote}
            </p>
          )}
          {detail.shortlist.map((v) => (
            <div
              key={v.name}
              className={cn(
                "rounded-xl border p-3.5",
                v.agentPick
                  ? "border-(--primary) bg-(--primary)/[0.04]"
                  : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {v.name}
                  </span>
                  {v.agentPick && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                      style={{ background: "var(--ai-gradient-strong)" }}
                    >
                      <AiMark size={10} aria-hidden />
                      Agent pick
                    </span>
                  )}
                </div>
                <span className="whitespace-nowrap text-base font-semibold text-foreground">
                  Est. {v.bid}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{v.source}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {v.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The judgment call the agent flagged for the buyer. */}
      {detail.attention && (
        <div className="mb-6 flex max-w-[560px] items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden
          />
          <span className="text-foreground">
            <span className="font-semibold">Needs your call · </span>
            {detail.attention}
          </span>
        </div>
      )}

      <p className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden />
        The output is AI generated. Please review.
      </p>

      {decision ? (
        <ResolvedAlert detail={detail} decision={decision} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => onResolve(primary.decision)}>
            {primary.label}
          </Button>
          {secondary && (
            <Button
              variant="outline"
              onClick={() => onResolve(secondary.decision)}
            >
              {secondary.label}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onResolve(reject.decision)}>
            {reject.label}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Right reference panel ─────────────────────────────────────────────────────

// Markers matching the AI toolkit guidelines' own activity timeline
// (app/guidelines/ai-toolkit/activity-timeline.tsx), sized down from its
// size-7 to size-5: this rail sits in a narrower column than that page's
// own example. "pending" (awaiting a person's decision, not queued AI
// work) keeps its own neutral dashed treatment rather than the
// guidelines' insight-toned "ai-upcoming", since it isn't an AI state;
// "event" (policy/system/DocuSign, no actor to mark) keeps its own quiet
// dot for the same reason. "ai-pass" adopts the guidelines' solid
// strong-gradient fill exactly (its "ai-complete"); "ai-warn" is the same
// solid-fill treatment, coloured for the outcome instead of the gradient,
// since the guidelines have no equivalent for a result that needs
// attention.
function renderDot(indicator: TimelineEntry["indicator"]) {
  if (indicator === "pending")
    return (
      <div className="size-5 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/30" />
    );
  if (indicator === "user")
    return (
      <Avatar className="size-5 shrink-0">
        <AvatarFallback className="bg-muted-foreground text-[8px] font-bold text-white">
          {REVIEWER_INITIALS}
        </AvatarFallback>
      </Avatar>
    );
  if (indicator === "ai-warn")
    return (
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-warning text-white">
        <AiMark size={10} />
      </div>
    );
  if (indicator === "ai-pass")
    return (
      <div
        className="flex size-5 shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: "var(--ai-gradient-strong)" }}
      >
        <AiMark size={10} />
      </div>
    );
  return (
    <div className="flex size-5 shrink-0 items-center justify-center">
      <div className="size-2 rounded-full bg-muted-foreground/50" />
    </div>
  );
}

function ActivityTab({
  detail,
  decision,
  activity,
}: {
  detail: Detail;
  decision: Resolution;
  activity?: TimelineEntry[] | null;
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

  const items = [...resolved, ...notes, ...(activity ?? detail.activity)];

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
              <div className="flex w-5 flex-col items-center">
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
              placeholder={ph("PH-36", "note")}
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

// Label above its value, both left aligned, so a long value wraps beneath
// the label instead of going ragged against a right-aligned edge (prompt
// 54). `min-w-0` lets the cell shrink inside the grid rather than forcing
// its column wide.
function DetailFieldPair({ field }: { field: DetailField }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{field.label}</dt>
      <dd className="text-sm font-medium text-foreground">{field.value}</dd>
    </div>
  );
}

// Grouped when `detailSections` is set (REQ-10482 today, prompt 53), else
// the flat list every other request still uses. Both paths render pairs in
// the same two column grid (prompt 54); only the section heading is
// unique to the grouped path.
function DetailsTab({ detail }: { detail: Detail }) {
  if (detail.detailSections) {
    return (
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-8">
          {detail.detailSections.map((section) => (
            <dl
              key={section.heading}
              className="grid grid-cols-2 gap-x-4 gap-y-4"
            >
              {section.fields.map((f) => (
                <DetailFieldPair key={f.label} field={f} />
              ))}
            </dl>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        {detail.details.map((f) => (
          <DetailFieldPair key={f.label} field={f} />
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

/** Collapsed to a slim rail, matching the left panel's own treatment
 * (prompt 40): the left panel keeps a persistent icon rail even while its
 * own content is hidden, both the collapse trigger's home and the restore
 * control; this is that same idea on the opposite edge, one button instead
 * of the left rail's several since there's only one thing here to restore,
 * not a choice between two contents. `PanelRightOpen` mirrors
 * `PanelLeftClose`'s own naming, the icon the left panel's collapse control
 * already uses. */
function RightPanelRail({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex h-full w-12 shrink-0 flex-col items-center border-l border-border/60 bg-card pt-4">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onOpen}
        aria-label="Open activity panel"
      >
        <PanelRightOpen className="size-4" />
      </Button>
    </div>
  );
}

function RightPanel({
  detail,
  decision,
  activity,
  open,
  onToggle,
}: {
  detail: Detail;
  decision: Resolution;
  /** Overrides `detail.activity` when a request needs its trail cut to
   * what has actually happened (REQ-10482 today). Absent for every other
   * request, which renders `detail.activity` exactly as before. */
  activity?: TimelineEntry[] | null;
  /** Held in Workbench.tsx (prompt 40, see the report on why), same as the
   * left panel's own open state. */
  open: boolean;
  onToggle: () => void;
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

  if (!open) {
    return <RightPanelRail onOpen={onToggle} />;
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
      <div className="flex shrink-0 items-center border-b border-border">
        <div className="flex flex-1">
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
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        {tab === "activity" && (
          <ActivityTab
            detail={detail}
            decision={decision}
            activity={activity}
          />
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
  /** Every decision made this session, not just this request's own (that's
   * `decision` above): the queue's segmented filter needs the whole map to
   * compute every row's effective status, not only the active one. */
  decisions: Record<string, Decision>;
  /** Left panel state and its handlers, held in Workbench.tsx (see the
   * report on why: this component remounts per request via its own
   * `key={openId}`, so state that must survive a request change can't live
   * here). */
  leftPanel: LeftPanelState;
  onLeftPanelRailClick: (content: LeftPanelContent) => void;
  onLeftPanelCollapse: () => void;
  selectedQueueSegment: WorkbenchStatus | "all";
  onSelectQueueSegment: (segment: WorkbenchStatus | "all") => void;
  /** The right activity rail's own collapse state (prompt 40), held in
   * Workbench.tsx for the same reason `leftPanel` is: this component
   * remounts per request, so state that must survive a request change
   * can't live here. */
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

/** Three-region escalation detail: left panel (queue or assistant) · the
 * agent's work + the call · reference. */
export function WorkbenchDetail({
  id,
  decision,
  onDecide,
  onBack,
  onSelect,
  decisions,
  leftPanel,
  onLeftPanelRailClick,
  onLeftPanelCollapse,
  selectedQueueSegment,
  onSelectQueueSegment,
  rightPanelOpen,
  onToggleRightPanel,
}: WorkbenchDetailProps) {
  const [centerView, setCenterView] = useState<CenterView>("finding");
  const [draftFor, setDraftFor] = useState<{
    exceptionId: string;
    draft: DraftMessage;
  } | null>(null);
  // The requester's lens on this same request: notes they posted land in Comms,
  // and an urgent flag they raised shows in the header.
  const {
    threads,
    urgent,
    addNote,
    exceptionOverrides,
    acceptException,
    requestExceptionCorrection,
    resolveExceptionByDocument,
  } = useRequests();

  const detail = WORKBENCH_DETAILS[id];
  if (!detail) return null;

  const notes = threads[id] ?? [];
  const isUrgent = urgent[id] === true;

  // The seed's own exceptions, overlaid with this session's live status
  // changes (accept / request correction). Absent for every request except
  // REQ-10482 today. Shared with the queue row's own chip (WorkbenchList)
  // so the two never compute the open count differently.
  const exceptions = applyExceptionOverrides(
    WORKBENCH_EXCEPTIONS[id] ?? [],
    exceptionOverrides[id] ?? {},
  );
  // The header's Need by field. `detail.needBy` (not `detail.timing`) is
  // the source: `timing` traces to whatever the flow set for the old flat
  // header line, need-by for some requests, activation or engagement
  // timing for others (see workbench/data.ts's own comment on the field),
  // so labelling it "Need by" unconditionally would misname it for those.
  // A plain date, one line, no driver sub-line (see workbench/data.ts's
  // own REQ-10482 entry for where that fuller context still lives).
  // The header's Assigned to text: the same source WorkbenchList.tsx's own
  // Assignee column reads (`row.assignee`), not a hardcoded "You". Every
  // request reachable from this queue is assigned to "You" today (see
  // WorkbenchLeftPanel.tsx's own QUEUE constant), but reading it from the
  // row rather than assuming it keeps this correct if that ever changes.
  const assigneeText =
    WORKBENCH_ROWS.find((r) => r.id === id)?.assignee ?? "You";
  const exceptionSummary = getExceptionSummary(exceptions);
  const openExceptionList = openExceptions(exceptions);
  // The one exception a reply can resolve right now, if any. Not
  // hardcoded to a particular exception id: whichever one is parked
  // waiting is the one the reply is for.
  const waitingException = exceptions.find((e) => e.status === "waiting");
  // Nothing open, nothing waiting, but there was something to resolve:
  // the moment validation completes and the request leaves the queue on
  // its own. A request with no exceptions at all (every J1/J2 row) never
  // satisfies this, since `exceptions` is empty for them.
  const autoReleased =
    exceptions.length > 0 &&
    exceptionSummary.openCount === 0 &&
    exceptionSummary.waitingCount === 0;
  // The header badge shares this same derivation with the queue row
  // (WorkbenchList), so the two never disagree: once released, the header
  // reads "Auto-cleared" too, not the seed's own "awaiting".
  const status: WorkbenchStatus = autoReleased
    ? "auto-cleared"
    : (decision ?? "awaiting");
  // The activity trail cut to what has actually happened, only for a
  // request that has exceptions at all (REQ-10482 today); every other
  // request's activity is untouched, `detail.activity` as before.
  const visibleActivity =
    exceptions.length > 0
      ? req10482VisibleActivity(exceptions, autoReleased)
      : null;

  function handleAcceptException(exceptionId: string) {
    acceptException(id, exceptionId);
  }

  function handleOpenDraft(exceptionId: string, draft: DraftMessage) {
    setDraftFor({ exceptionId, draft });
  }

  function handleSendDraft() {
    if (!draftFor) return;
    const waitingOn = draftFor.draft.toName ?? draftFor.draft.to;
    requestExceptionCorrection(id, draftFor.exceptionId, waitingOn);
    // The draft posts to this same request's shared thread. The requester's
    // own view reads the identical `threads` state (see the report).
    addNote(id, draftFor.draft.body, getPerson("sam-rivera").name);
    setDraftFor(null);
  }

  // The reply's trigger, chosen for this prototype: a presenter-visible
  // button rather than a live inbox or a timer (see the report). Posts the
  // supplier's own seeded reply into this same thread, then resolves the
  // waiting exception by document, not by a person acting.
  function handleSupplierReply() {
    if (!waitingException) return;
    addNote(id, SUPPLIER_REPLY.body, getPerson(SUPPLIER_REPLY.from).name);
    resolveExceptionByDocument(id, waitingException.id);
  }

  return (
    // Mounted here, not inside `WorkbenchLeftPanel` (prompt 46, moved up
    // from there): the evidence chip lives in the centre pane below, a
    // sibling of the left panel, and posting into the same thread the
    // panel renders means both need the same provider instance. Keyed to
    // `id` for clarity, though `WorkbenchDetail` itself already remounts
    // per request (`key={openId}`, one level up in Workbench.tsx), so a
    // request change resets this regardless.
    <AssistantThreadProvider key={id}>
      <div className="flex h-full min-h-0">
        <WorkbenchLeftPanel
          activeId={id}
          onSelect={onSelect}
          onBack={onBack}
          panel={leftPanel}
          onRailClick={onLeftPanelRailClick}
          onCollapse={onLeftPanelCollapse}
          selectedSegment={selectedQueueSegment}
          onSelectSegment={onSelectQueueSegment}
          decisions={decisions}
          exceptionOverrides={exceptionOverrides}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Header, the Apollo Vertex PageHeader (see the report): id primary,
            request title secondary, matching the approver's own header
            (DecisionWindow.tsx). Canonical item order (prompt 31): the
            fields this surface has, in the shared order, with "Requested
            by" (not "Requester") to match the label used across both
            surfaces. Status among the metadata items rather than a
            floating chip. The type chip stays dropped: the reference has
            no equivalent, and the type is already visible in the queue
            list to the left.

            No header back control: the queue pane to the left already
            carries one ("Back to all requests"), so a second one here
            would duplicate it. The rule (see DecisionWindow.tsx's own
            header comment): a header gets a back control only when no
            sibling pane already provides that same path back. */}
          <PageHeader
            bordered
            className="shrink-0 px-6 sm:px-6 lg:px-6 @3xl:!grid-cols-[auto_1fr_auto] @3xl:gap-1"
          >
            <PageHeaderNav>
              <PageHeaderTitleGroup className="min-w-[160px] max-w-[160px]">
                <PageHeaderTitle>{detail.id}</PageHeaderTitle>
                <TruncatedSubtitle text={detail.request} />
              </PageHeaderTitleGroup>
            </PageHeaderNav>

            {/* ml-10: the grid's own column gap (gap-1, 4px) isn't enough
                breathing room between the title group and Requested by on
                its own; margin guarantees the extra 40px regardless of how
                the surrounding columns size themselves. */}
            <PageHeaderContent className="@3xl:ml-10 @3xl:justify-between @3xl:gap-0.5">
              {isUrgent && (
                <Badge
                  status="error"
                  variant="secondary"
                  className="shrink-0 gap-1 rounded-[4px]"
                >
                  <TriangleAlert className="size-3" aria-hidden />
                  Urgent
                </Badge>
              )}
              <PageHeaderField className="shrink-0">
                {/* "Requested by", not "Requester": one label per field across
                  both surfaces (prompt 31), matching the approver's own
                  header (DecisionWindow.tsx), which already used this
                  label. */}
                <PageHeaderFieldLabel>Requested by</PageHeaderFieldLabel>
                <PageHeaderFieldValue className="overflow-visible">
                  {detail.requester}
                </PageHeaderFieldValue>
              </PageHeaderField>
              <PageHeaderField className="shrink-0">
                <PageHeaderFieldLabel>Value</PageHeaderFieldLabel>
                <PageHeaderFieldValue className="overflow-visible">
                  {detail.value}
                </PageHeaderFieldValue>
              </PageHeaderField>
              <PageHeaderField className="shrink-0">
                <PageHeaderFieldLabel>Need by</PageHeaderFieldLabel>
                <PageHeaderFieldValue className="overflow-visible">
                  {detail.needBy}
                </PageHeaderFieldValue>
              </PageHeaderField>
              <PageHeaderField className="shrink-0">
                {/* One form of the fact, not two (prompt 31): an avatar next
                  to the literal word "You" said "assigned to the current
                  user" twice. Plain text instead, the same field
                  WorkbenchList.tsx's own Assignee column already renders
                  (`row.assignee`): "You" for a self-assigned row, a real
                  name (e.g. "Dana Lopez") otherwise, so this reads
                  correctly regardless of who the row belongs to. */}
                <PageHeaderFieldLabel>Assigned to</PageHeaderFieldLabel>
                <PageHeaderFieldValue className="overflow-visible">
                  {assigneeText}
                </PageHeaderFieldValue>
              </PageHeaderField>
              {/* The last field in the row (prompt 34): unlike the others, this
                one is allowed to shrink and its badge to ellipsis internally
                (min-w-0/shrink override the badge's own shrink-0), so a tight
                container compresses this field instead of the row pushing
                the badge past the edge. No overflow-visible here (unlike its
                siblings): this field is the one that has to give when the
                row runs out of room, so its own box needs to actually clip
                the badge rather than let it paint over the neighboring
                action button. Nested truncate span for the same reason as
                the PH-37 button below: text-overflow doesn't reliably apply
                to a flex container's own direct text child. */}
              <PageHeaderField className="min-w-0 shrink">
                <PageHeaderFieldLabel>Status</PageHeaderFieldLabel>
                <PageHeaderFieldValue>
                  <Badge
                    status={STATUS_BADGE[status]}
                    variant="secondary"
                    className="min-w-0 max-w-full shrink"
                  >
                    <span className="truncate">
                      {(decision && detail.resolvedTitles?.[decision]) ??
                        STATUS_LABEL[status]}
                    </span>
                  </Badge>
                </PageHeaderFieldValue>
              </PageHeaderField>
            </PageHeaderContent>

            {/* Record level disposition (prompt 31) rendered nothing here
              (prompt 55): which disposition Sam has (hold, reassign, or
              something else) is still unresolved content, and giving that
              unresolved action a placeholder icon would make an
              unsettled structural question look like a settled control
              (see PH-37, left bracketed, not given a provisional value). */}
            <PageHeaderActions />
          </PageHeader>

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
                    {v === "finding" ? (
                      FORK_LABEL[detail.type]
                    ) : (
                      <>
                        Comms
                        {notes.length > 0 && (
                          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                            {notes.length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                ))}
              </div>

              {centerView === "finding" ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {/* Independent of whichever exception is active below: a
                    waiting exception surfaces here regardless of order (see
                    the report), and never shares space with the active
                    exception's own content. */}
                  {exceptionSummary.waitingCount > 0 && (
                    <div className="mx-4 mt-4 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:mx-6 lg:mx-8">
                      <Clock className="size-3.5 shrink-0" aria-hidden />
                      Waiting on {exceptionSummary.waitingOn}
                      {waitingException && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto"
                          onClick={handleSupplierReply}
                        >
                          Simulate supplier reply
                        </Button>
                      )}
                    </div>
                  )}
                  {openExceptionList.length > 0 ? (
                    <ExceptionSurface
                      openList={openExceptionList}
                      onAccept={handleAcceptException}
                      onOpenDraft={handleOpenDraft}
                    />
                  ) : autoReleased ? (
                    <AutoReleaseCompletion exceptions={exceptions} />
                  ) : exceptionSummary.waitingCount === 0 ? (
                    <Finding
                      detail={detail}
                      decision={decision}
                      onResolve={(d) => onDecide(id, d)}
                    />
                  ) : null}
                </div>
              ) : notes.length > 0 ? (
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-6">
                  {notes.map((n) => {
                    const requesterName = detail.requester.split(" · ")[0];
                    const buyerName = getPerson("sam-rivera").name;
                    const role =
                      n.author === requesterName
                        ? "requester"
                        : n.author === buyerName
                          ? "you"
                          : "supplier";
                    return (
                      <div
                        key={n.id}
                        className="max-w-[80%] rounded-xl border bg-muted/40 px-3.5 py-2.5"
                      >
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {n.author}
                          </span>{" "}
                          · {role} · {n.time}
                        </p>
                        <p className="mt-1 text-sm text-foreground">{n.text}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No messages yet.
                  </p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Start a thread with the requester or the vendor. Replies
                    land here.
                  </p>
                </div>
              )}
            </div>

            <RightPanel
              detail={detail}
              decision={decision}
              activity={visibleActivity}
              open={rightPanelOpen}
              onToggle={onToggleRightPanel}
            />
          </div>
        </div>

        {draftFor && (
          <CorrectionDraftModal
            draft={draftFor.draft}
            onSend={handleSendDraft}
            onDiscard={() => setDraftFor(null)}
          />
        )}
      </div>
    </AssistantThreadProvider>
  );
}
