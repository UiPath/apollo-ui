"use client";

// oxlint-disable max-lines -- the 3-region escalation detail, adapted from the IP layout

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  Info,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  TriangleAlert,
  User,
} from "lucide-react";
import { type PointerEvent, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import {
  AgentSummary,
  EvidenceChips,
  type EvidenceItem,
  type SummaryMark,
  SummaryMarkSpan,
} from "../AgentSummary";
import { Caveat } from "../DecisionActionRow";
import {
  BENCHMARK_CONCLUSION_LINE,
  BENCHMARK_EVIDENCE,
  BENCHMARK_REASON_LINE,
  COMPARABLE_DEALS,
  DETECTION_LINE,
  DEVIATION_BAND_LABEL,
  DEVIATION_BAND_RATIO,
  DEVIATION_BAND_RELATION,
  DEVIATION_METRIC_SUB_LINE,
  DEVIATION_PCT,
  DEVIATION_PCT_SIGNED,
  DEVIATION_ROUTING_CONSEQUENCE,
  DEVIATION_SCALE_VISIBLE,
  DEVIATION_VERDICT,
  type DraftMessage,
  type Exception,
  getExceptionSummary,
  getPerson,
  MARKET_REFERENCES_LINE,
  openExceptions,
  ph,
  RELEASE_RECORD,
  SUPPLIER_REPLY,
  type Suggestion,
} from "../data";
import { useRequests } from "../requests/requests-context";
import { TruncatedSubtitle } from "../requests/TruncatedSubtitle";
import { CorrectionDraftModal } from "./CorrectionDraftModal";
import {
  applyExceptionOverrides,
  type Decision,
  type WorkbenchDetail as Detail,
  FORK_BADGE_STATUS,
  FORK_LABEL,
  req10482VisibleActivity,
  STATUS_BADGE,
  STATUS_LABEL,
  type TimelineEntry,
  timelineEntryTime,
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

const PRICE_EXCEPTION_ID = "price-above-benchmark";

/** A metric's own label, plus an info affordance carrying its provenance
 * (prompt 39): the sub lines used to render as their own visible line
 * under the value, but three of them stacked was most of the text on the
 * pane for content whose point is the number, not its provenance. Apollo's
 * own tooltip primitive (`@/components/ui/tooltip`, Radix underneath):
 * `TooltipTrigger` renders the trigger as whatever's passed via `asChild`
 * (a real `<button>` here, so it's a tab stop) and Radix wires the
 * open-on-hover-or-focus behaviour and the `aria-describedby` link to the
 * content itself, so this is keyboard reachable and exposed to assistive
 * technology without anything bespoke here. `info` is unchanged content
 * (the same string that used to render as the sub line), never shortened
 * to fit. */
function MetricLabel({ label, info }: { label: string; info: string }) {
  return (
    <span className="flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold leading-snug tracking-normal text-muted-foreground">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About ${label}`}
            className="text-muted-foreground/70 hover:text-foreground"
          >
            <Info className="size-2.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent>{info}</TooltipContent>
      </Tooltip>
    </span>
  );
}

/** One metric column: label (with an optional info affordance) above a
 * large value, its unit inline after it in a smaller, secondary colour so
 * the figure stays the prominent thing and the unit stays legible rather
 * than competing with it. Column layout again, matching `Finding`'s own
 * metrics grid below (28px/semibold/tight) rather than the stacked rows
 * prompt 40 switched to when three unit-bearing values physically
 * overlapped at the pane's own narrower widths; verified live at this
 * pane's normal operating width instead (see the report). `valueClassName`
 * is the one role colour this pane uses (the deviation's `text-warning`);
 * every other column passes nothing and gets the plain foreground colour. */
function MetricColumn({
  label,
  info,
  value,
  unit,
  suffix,
  valueClassName,
}: {
  label: string;
  info?: string;
  value: string;
  unit?: string;
  /** A trailing fact beneath the value: only the deviation column uses
   * this, to state the band under its own figure. */
  suffix?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-6 py-[18px] first:pl-0">
      {info == null ? (
        <span className="whitespace-nowrap text-[10px] font-semibold leading-snug tracking-normal text-muted-foreground">
          {label}
        </span>
      ) : (
        <MetricLabel label={label} info={info} />
      )}
      <span className="whitespace-nowrap">
        <span
          className={cn(
            "text-[28px] font-semibold leading-none tracking-tight",
            valueClassName,
          )}
        >
          {value}
        </span>
        {unit != null && (
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </span>
      {suffix != null && (
        <span className="text-xs font-normal text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Proximity to the decision band's own limit, so the reader sees how close
 * the deviation sits rather than comparing two numbers by hand. Own end
 * labels: 0 is the scale's own origin, the band is `DEVIATION_BAND_LABEL`,
 * both derived, nothing authored.
 *
 * A position marker, not a fill-to-point (prompt 38): a filled bar read as
 * progress toward a limit, when this is a position within a range, one
 * side of which happens to be the request's own commercial decision band.
 * The marker sits at `DEVIATION_BAND_RATIO`, the same ratio the old fill
 * used, just rendered as a discrete point with its own label
 * (`DEVIATION_PCT_SIGNED`, the same signed value the metric row shows)
 * rather than a length.
 *
 * Conditional (prompt 39, `DEVIATION_SCALE_VISIBLE`, see cockpit-10482.ts):
 * a graphic restating what the deviation metric already states in words
 * only earns its place once the number alone under-communicates the
 * position, which this component doesn't decide for itself, the caller
 * does (see `ExceptionSurface` below). Lives in group one now, directly
 * beneath the deviation row (prompt 40), not as a separate block after the
 * whole metric row. */
function DeviationScale() {
  const markerPositionPct = DEVIATION_BAND_RATIO * 100;
  return (
    <div className="mt-3 w-full">
      <div className="relative h-1.5 w-full rounded-full bg-muted">
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-warning bg-background"
          style={{ left: `${markerPositionPct}%` }}
        />
      </div>
      <div className="relative mt-1.5 h-4">
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap text-xs font-medium text-warning"
          style={{ left: `${markerPositionPct}%` }}
        >
          {DEVIATION_PCT_SIGNED}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>{DEVIATION_BAND_LABEL}</span>
      </div>
    </div>
  );
}

/** The comparison across sources, columns again (see the reference in the
 * report): `divide-x` between three equal columns, matching `Finding`'s own
 * metrics grid rather than the stacked `divide-y` rows prompt 40 switched
 * to. `role` marks the governing and deviating sides where the seed says
 * so; a side with no role (e.g. a third source that's merely consistent)
 * renders plain.
 *
 * One fill rule for the whole pane (prompt 36, carried forward through
 * prompt 37's colour-not-fill version): a role colour marks the value an
 * exception's own decision turns on, not merely a side that differs from
 * another. That's the deviation column alone, a derived figure that only
 * exists because something is open; the ordinary sides below carry no
 * colour regardless of `role`.
 *
 * `subLine` (prompt 38) is the tooltip on the label (prompt 39, see
 * `MetricLabel`), only when a side has one: currently just the price
 * exception's two sides (see cockpit-10482.ts). The terms exception's own
 * three sides have no composable sub line in the seed (see the report), so
 * they render a plain label with no info affordance. `unit` (prompt 40) is
 * likewise optional and absent for the terms exception's own plain payment
 * terms values. */
function ExceptionFinding({ exception }: { exception: Exception }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-border">
      {exception.finding.sides.map((side) => (
        <MetricColumn
          key={side.label}
          label={side.label}
          info={side.subLine}
          value={side.value}
          unit={side.unit}
        />
      ))}
      {exception.id === PRICE_EXCEPTION_ID && (
        <MetricColumn
          label="Deviation"
          info={DEVIATION_METRIC_SUB_LINE}
          value={DEVIATION_PCT_SIGNED}
          suffix={DEVIATION_BAND_LABEL}
          valueClassName="text-warning"
        />
      )}
    </div>
  );
}

function suggestionLabel(suggestion: Suggestion): string {
  return suggestion.type === "accept" ? "Accept" : "Request correction";
}

// One line per comparable deal, joined rather than authored: descriptor,
// seat count, and price per year, all read from COMPARABLE_DEALS.
const COMPARABLE_DEALS_DETAIL = COMPARABLE_DEALS.map(
  (deal) =>
    `${deal.descriptor} · ${deal.seats.toLocaleString("en-US")} seats · $${deal.pricePerYear}/yr`,
).join("; ");

// Flagging for review: named by the prompt, unresolved in behaviour (see
// PH-35). No-op until that's ruled on.
function handleFlagForReview() {
  // Intentionally empty, see PH-35.
}

// The evidence link into the benchmark's own supporting detail (prompt 38):
// no destination exists yet (see the report), so this stays a no-op behind
// PH-39 rather than building the detail view this prompt explicitly excludes.
function handleViewBenchmarkDetail() {
  // Intentionally empty, see PH-39.
}

// Sharing feedback on the agent's benchmark finding: named by the reference
// card, unresolved in behaviour (see PH-40). No-op until that's ruled on.
function handleShareFeedback() {
  // Intentionally empty, see PH-40.
}

// The header's record level disposition (prompt 31): which one, if any, is
// unresolved content (see PH-37). No-op until that's ruled on.
function handleRecordDisposition() {
  // Intentionally empty, see PH-37.
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
 * so there's no legibility reason to keep them apart. Its own detail
 * concatenates both existing lines rather than authoring a new one.
 *
 * The evidence link (prompt 38) sits beside the chip: no destination
 * exists for the benchmark's own supporting detail view (see the report),
 * so it's a no-op behind PH-39, not a build of that view.
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
 * Plain muted text, not link styled, matching PH-39's own established
 * reasoning below: a no-op placeholder isn't a link to anything yet, so it
 * shouldn't look like one, even though the reference renders it as a link.
 *
 * PH-39 (prompt 39) is plain muted text, not link styled: a no-op
 * placeholder isn't a link to anything yet, so it shouldn't look like one. */
function ExceptionAgentSummary({
  exception,
  onAccept,
  onOpenDraft,
}: {
  exception: Exception;
  onAccept: (exceptionId: string) => void;
  onOpenDraft: (exceptionId: string, draft: DraftMessage) => void;
}) {
  const items: EvidenceItem[] = [
    {
      key: "benchmark-evidence",
      label: `${COMPARABLE_DEALS.length} comparable deals, ${BENCHMARK_EVIDENCE.marketReferences} market references`,
      detail: `${COMPARABLE_DEALS_DETAIL} · ${MARKET_REFERENCES_LINE}`,
    },
  ];
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
          {/* 2. Body: the conclusion, its evidence, and the link into the
              evidence's own detail. */}
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
              <div className="flex flex-wrap items-start gap-3">
                <EvidenceChips items={items} />
                <button
                  type="button"
                  onClick={handleViewBenchmarkDetail}
                  className="text-left text-xs text-muted-foreground hover:text-foreground"
                >
                  {ph("PH-39", "evidence detail")}
                </button>
              </div>
            }
          />
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
  onOpenAssistant: _onOpenAssistant,
}: {
  openList: Exception[];
  onAccept: (exceptionId: string) => void;
  onOpenDraft: (exceptionId: string, draft: DraftMessage) => void;
  /** The programmatic entry point (prompt 32): swaps the left panel to the
   * assistant and marks the rail accordingly, from anywhere in this pane.
   * Nothing here calls it yet, there's no action on this surface that needs
   * it today; it's threaded through so a later one can, without adding a
   * second way to open the assistant. */
  onOpenAssistant: () => void;
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
            see `Finding`'s own seed rows). Composed at render time, not
            concatenated into a literal: `active.headline` is the seed
            string, `DEVIATION_VERDICT` is the same live derived value the
            deviation metric and its role colour already read, so this
            still flips if the deviation crosses the band. Price exception
            only: the terms exception has no equivalent graduated check, so
            its headline renders alone, no trailing comma or empty clause. */}
        <h2 className="max-w-[26ch] text-balance text-[28px] font-bold leading-[1.2] tracking-tight text-foreground">
          {active.headline}
          {isPrice && `, ${DEVIATION_VERDICT}`}
        </h2>

        <div className="mt-4">
          <ExceptionFinding exception={active} />
        </div>

        {isPrice && DEVIATION_SCALE_VISIBLE && <DeviationScale />}
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

/** How a single exception resolved: a person's name, or a document's own
 * version, tagged rather than read out of a string, per the model's own
 * distinction (see the report). No control here resolves anything, this
 * only renders what already happened. */
function ExceptionResolutionLine({ exception }: { exception: Exception }) {
  const resolution = exception.resolution;
  if (!resolution) return null;
  const byPerson = resolution.resolvedBy === "person";
  return (
    <div className="flex items-center gap-2 text-sm">
      {byPerson ? (
        <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <FileCheck
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}
      <span className="text-foreground">{exception.headline}</span>
      <span className="text-muted-foreground">
        resolved by{" "}
        {byPerson ? getPerson(resolution.by).name : `document ${resolution.by}`}
      </span>
    </div>
  );
}

/**
 * The auto-release completion state: renders once every exception on the
 * request is resolved, none open, none waiting. Everything here is
 * RELEASE_RECORD (../data/cockpit-10482.ts) or the exceptions' own
 * resolution field, nothing authored. Success (green) throughout, since
 * nothing on this screen is an open exception any more. No approve, accept,
 * or confirm control appears here, this is a record of what already
 * happened automatically.
 */
function AutoReleaseCompletion({ exceptions }: { exceptions: Exception[] }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      <Alert status="success" visual="tinted" className="max-w-[560px]">
        <CheckCircle2 />
        <AlertTitle>Validation completed automatically</AlertTitle>
        <AlertDescription>
          {timelineEntryTime(RELEASE_RECORD.when)}
        </AlertDescription>
      </Alert>

      {/* The system's own action, not a person's: the reprocessing that made
          the automatic resolution possible. AiMark, the same distinct
          marking TIMELINE's own agent-actor entries already carry. */}
      <div className="mt-4 flex max-w-[560px] items-start gap-2 text-sm text-muted-foreground">
        <AiMark size={14} className="mt-0.5 shrink-0" />
        <span>{DETECTION_LINE.text}</span>
      </div>

      <div className="mt-5 max-w-[560px] space-y-2">
        {exceptions.map((exception) => (
          <ExceptionResolutionLine key={exception.id} exception={exception} />
        ))}
      </div>

      <div className="mt-6 max-w-[560px] rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Next step
        </p>
        <p className="mt-1.5 text-sm font-semibold text-foreground">
          {RELEASE_RECORD.nextStep.label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {RELEASE_RECORD.nextStepOwner.name} ·{" "}
          {RELEASE_RECORD.nextStepOwner.role}
        </p>
      </div>

      <div className="mt-6 max-w-[560px]">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Timing
        </p>
        <div className="space-y-1.5">
          {RELEASE_RECORD.timingTrail.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="text-foreground">{event.label}</span>
              <span className="shrink-0 text-muted-foreground">
                {timelineEntryTime(event.when)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 max-w-[560px] text-sm text-muted-foreground">
        {RELEASE_RECORD.closingStatement}
      </p>
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
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label="Close activity panel"
          className="mx-1 shrink-0"
        >
          <PanelRightClose className="size-4" />
        </Button>
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
  /** The programmatic entry point (prompt 32, item 3): unconditionally
   * opens the panel to the assistant, distinct from the rail's own toggle
   * behaviour (`onLeftPanelRailClick`), which collapses when the target is
   * already active. An action that needs the assistant wants it open, not
   * toggled, even if it happened to already be open on the assistant. */
  onOpenAssistant: () => void;
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
  onOpenAssistant,
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
  // The header's Need by field, split rather than restated. `detail.needBy`
  // (not `detail.timing`) is the source: `timing` traces to whatever the
  // flow set for the old flat header line, need-by for some requests,
  // activation or engagement timing for others (see workbench/data.ts's own
  // comment on the field), so labelling it "Need by" unconditionally would
  // misname it for those. `needBy` is consistently a when-needed value
  // across every request; REQ-10482's is the one that also carries a
  // driver, joined by " · " (see cockpit-10482.ts / req-10482.ts).
  // `needByDriver` is undefined wherever no driver segment exists, guarded
  // at the render site.
  const [needByDate, needByDriver] = detail.needBy.split(" · ");
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

          <PageHeaderContent className="@3xl:justify-between @3xl:gap-0.5">
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
                {needByDate}
              </PageHeaderFieldValue>
              {needByDriver != null && (
                <p className="truncate text-[11px] text-muted-foreground">
                  {needByDriver}
                </p>
              )}
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

          {/* Record level disposition (prompt 31): the header carries the
              action on the whole request, the pane carries the decision on
              whichever exception is active. Which disposition Sam has here
              (hold, reassign, or something else) is unresolved content, so
              this is a registered placeholder wired to a no-op, not an
              invented action (see PH-37).
              An icon, not a truncated text button (prompt 39): the header
              has no room for the full placeholder text, and truncating it
              to an ellipsis is exactly the treatment this prompt's own
              placeholder rule rules out. A generic overflow icon (the same
              one this app already uses elsewhere for an undetermined set
              of actions, e.g. DecisionWindow.tsx's own header) is a
              reasonable stand in for an action with no settled shape yet,
              and the tooltip on it carries the full placeholder text
              without truncation, reusing the same affordance pattern
              section 2 established for the metrics. */}
          <PageHeaderActions>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  aria-label="Record level disposition"
                  onClick={handleRecordDisposition}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {ph("PH-37", "record disposition")}
              </TooltipContent>
            </Tooltip>
          </PageHeaderActions>
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
                    onOpenAssistant={onOpenAssistant}
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
                  Start a thread with the requester or the vendor. Replies land
                  here.
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
  );
}
