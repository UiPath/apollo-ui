"use client";

import {
  Check,
  ChevronDown,
  ExternalLink,
  Info,
  Loader2,
  MoreHorizontal,
  Pencil,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { Checkbox } from "@/registry/checkbox/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/popover/popover";
import { Textarea } from "@/registry/textarea/textarea";
import {
  type AttestationRecord,
  type ChipId,
  type DetailCorrections,
  isRouteSuggestion,
  isSupplierRoute,
  ROUTE_REASONS,
  type RunEventInput,
  routeOwner,
  type Suggestion,
  type SuggestionFeedbackRecord,
  suggestionAimCorrection,
  suggestionLabel,
} from "./invoice-review-data";
import { ReasonDialog } from "./ReasonDialog";

/**
 * Card action grammar: at most two buttons (direct fix + delegate), plus an
 * optional ✕ icon at the header-right for the "reject / keep-as-is" path.
 *
 * The ✕ appears when the primary suggestion is a data mutation AND a verify
 * suggestion is also present. In that case the verify is lifted out of the
 * button row and rendered as the ✕ — it commits as an attestation, never a
 * silent dismiss. Hovering the ✕ rings its value (empty-sentinel aim so the
 * field is highlighted but no ghost arrow is shown).
 *
 * For suggest_po suggestions the primary becomes a split button: the label
 * side commits the chosen candidate, the chevron opens the candidate list. A
 * ⋯ overflow after the delegate button opens the "Keep without a PO" path.
 */
interface SuggestedFixCardProps {
  suggestions: Suggestion[];
  onResolve: (s: Suggestion, reason?: string, note?: string) => void;
  disabled?: boolean;
  onAim?: (correction: DetailCorrections | null) => void;
  applying?: boolean;
  /** Called when the user confirms "Keep without a purchase order". */
  onAttest?: (record: AttestationRecord) => void;
  /** ID of the exception this card is fixing — used to build attestation and feedback records. */
  exceptionId: string;
  /** Called on feedback submit (both branches). Passes person event; correction branch also passes superseded prose. */
  onFeedback?: (
    record: SuggestionFeedbackRecord,
    personEvent: RunEventInput,
    supersededProse?: string,
  ) => void;
  /** Called after the fake regen delay to append the sparkle timeline event. */
  onFeedbackRegen?: (sparkleEvent: RunEventInput) => void;
  /** Canned regen prose to show after a correction-path submission. */
  regenResult?: { prose: string };
  /** Number of times the correction path has been submitted; drives the "revised N×" label. */
  revisionCount?: number;
}

export function SuggestedFixCard({
  suggestions,
  onResolve,
  disabled,
  onAim,
  applying,
  onAttest,
  exceptionId,
  onFeedback,
  onFeedbackRegen,
  regenResult,
  revisionCount = 0,
}: SuggestedFixCardProps) {
  const gradientId = `ai-mark-${exceptionId}`;

  // All hooks must be unconditional — declare before the early return.
  const [chosenCandidate, setChosenCandidate] = useState<{
    po: string;
    evidence: string;
    primary?: boolean;
  } | null>(null);
  const [attestMode, setAttestMode] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const regenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState<
    "pick" | "positive" | "correction"
  >("pick");
  const [feedbackChips, setFeedbackChips] = useState<Set<ChipId>>(new Set());
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackShare, setFeedbackShare] = useState(true);

  if (suggestions.length === 0) return null;
  const [primary, ...rest] = suggestions;

  // A verify suggestion acts as the ✕ only when the primary is a data mutation.
  // When verify IS the primary (e.g. "Keep 48 units"), it stays as a button.
  const primaryIsMutation =
    primary.type === "suggest_correction" ||
    primary.type === "suggest_po" ||
    primary.type === "suggest_account" ||
    primary.type === "suggest_tax_code";
  const xIdx = primaryIsMutation
    ? rest.findIndex((s) => s.type === "verify")
    : -1;
  const xSuggestion = xIdx >= 0 ? rest[xIdx] : null;
  // Remove the ✕ suggestion from the button row, then cap at one alternate
  // (primary + one delegate = two total buttons).
  const buttonAlts = xIdx >= 0 ? rest.filter((_, i) => i !== xIdx) : rest;
  const buttonSuggestions = [primary, ...buttonAlts.slice(0, 1)];

  // suggest_po: seed the default candidate on first render.
  const isPo = primary.type === "suggest_po";
  const effectiveCandidate =
    chosenCandidate ??
    (isPo
      ? (primary.candidates?.find((c) => c.primary) ??
        primary.candidates?.[0] ??
        null)
      : null);

  const showOverflow = isPo && !!onAttest;
  // Footer shows for PO cards (AI disclosure) or any card with a feedback handler.
  const showFooter = isPo || !!onFeedback;

  function closeFeedback() {
    setFeedbackOpen(false);
    // Reset step/state on close so a re-open starts fresh.
    setFeedbackStep("pick");
    setFeedbackChips(new Set());
    setFeedbackNote("");
    setFeedbackShare(true);
  }

  function handlePositiveSubmit() {
    const record: SuggestionFeedbackRecord = {
      findingId: exceptionId,
      sentiment: "right",
      chips: [],
      note: feedbackNote.trim() || undefined,
      shareWithUiPath: feedbackShare,
      by: "person",
      at: new Date().toISOString(),
    };
    const personEvent: RunEventInput = {
      kind: "person",
      label: "Feedback shared · got it right",
      sub: "By you",
      time: "Just now",
    };
    onFeedback?.(record, personEvent, undefined);
    closeFeedback();
  }

  function handleCorrectionSubmit() {
    const hasNote = feedbackNote.trim().length > 0;
    const record: SuggestionFeedbackRecord = {
      findingId: exceptionId,
      sentiment: "correction",
      chips: [...feedbackChips] as ChipId[],
      note: hasNote ? feedbackNote.trim() : undefined,
      shareWithUiPath: feedbackShare,
      by: "person",
      at: new Date().toISOString(),
    };
    const personEvent: RunEventInput = {
      kind: "person",
      label: "Feedback shared · needs correction",
      sub: hasNote ? "By you · with note" : "By you",
      time: "Just now",
    };
    // Superseded prose = what's currently showing; appended to audit trail.
    const currentProse =
      revisionCount > 0 && regenResult ? regenResult.prose : primary.reasoning;
    onFeedback?.(record, personEvent, currentProse);
    closeFeedback();
    // Start the fake regen sequence.
    setRegenLoading(true);
    const sparkleEvent: RunEventInput = {
      kind: "regen",
      label: "Suggest solutions re-ran",
      sub: "Triggered by your feedback",
      time: "Just now",
    };
    if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
    regenTimerRef.current = setTimeout(() => {
      onFeedbackRegen?.(sparkleEvent);
      setRegenLoading(false);
      regenTimerRef.current = null;
    }, 2000);
  }

  function toggleChip(id: ChipId) {
    setFeedbackChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Reasoning to display: regen prose when revised, interim when loading.
  const displayReasoning = regenLoading
    ? null
    : revisionCount > 0 && regenResult
      ? regenResult.prose
      : primary.reasoning;

  // Label: gradient "Suggested next step" + muted "· revised N×" when applicable.
  const revised = revisionCount > 0;

  return (
    <TooltipProvider>
      <div className="relative mt-5 max-w-[480px]">
        {/* AI gradient shadow behind the glass surface. */}
        <AiGlow />
        {/* Gradient definition for the single mark. */}
        <svg width={0} height={0} aria-hidden="true" className="absolute">
          <defs>
            <linearGradient
              id={gradientId}
              x1="2"
              y1="4"
              x2="22"
              y2="20"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="var(--ai-gradient-start)" />
              <stop offset="1" stopColor="var(--ai-gradient-end)" />
            </linearGradient>
          </defs>
        </svg>
        <Card
          variant="glass"
          className="relative bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]"
        >
          <CardContent className="flex flex-col">
            {/* Header row: gradient mark + label on the left, ✕ on the right. */}
            <div className="flex items-center gap-1.5">
              <AiMark size={14} gradientId={gradientId} />
              <span
                className="text-base font-semibold tracking-tight"
                style={{
                  backgroundImage: "var(--ai-gradient-text)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Suggested next step
              </span>
              {revised && (
                <span className="text-[12px] font-medium text-muted-foreground/70">
                  · revised {revisionCount}×
                </span>
              )}
              {xSuggestion && (
                <div className="ml-auto">
                  <RejectButton
                    suggestion={xSuggestion}
                    disabled={disabled}
                    onResolve={onResolve}
                    onAim={onAim}
                  />
                </div>
              )}
            </div>
            {/* Reasoning: normal, regen-loading interim, or regen prose. */}
            {regenLoading ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground/60">
                <AiMark
                  size={12}
                  className="shrink-0 motion-safe:animate-pulse"
                />
                Suggest solutions re-running with your feedback…
              </p>
            ) : displayReasoning ? (
              <p className="mt-2 text-sm leading-normal text-muted-foreground">
                {displayReasoning}
              </p>
            ) : null}
            {attestMode ? (
              <AttestConfirm
                exceptionId={exceptionId}
                onAttest={onAttest!}
                onBack={() => setAttestMode(false)}
                disabled={disabled}
              />
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {buttonSuggestions.map((s, i) =>
                  s.type === "suggest_po" ? (
                    <PoSplitButton
                      key={`${s.type}-${i}`}
                      suggestion={s}
                      chosenCandidate={effectiveCandidate}
                      onCandidateSelect={setChosenCandidate}
                      disabled={disabled || applying}
                      applying={applying}
                      onResolve={onResolve}
                    />
                  ) : (
                    <ActionButton
                      key={`${s.type}-${i}`}
                      suggestion={s}
                      disabled={disabled || applying}
                      applying={applying}
                      onResolve={onResolve}
                      onAim={onAim}
                    />
                  ),
                )}
                {showOverflow && (
                  <OverflowMenu
                    disabled={disabled || applying}
                    onKeepWithoutPo={() => setAttestMode(true)}
                  />
                )}
              </div>
            )}
            {showFooter && (
              <>
                <div className="mt-8 flex items-center justify-between gap-2">
                  {isPo && (
                    <p className="flex items-center gap-1 text-[11px] leading-none text-muted-foreground/60">
                      <Info size={11} className="shrink-0" />
                      The output is AI generated. Please review.
                    </p>
                  )}
                  {onFeedback && (
                    <Popover
                      open={feedbackOpen}
                      onOpenChange={(o) => {
                        if (!o) closeFeedback();
                        else setFeedbackOpen(true);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="ml-auto shrink-0 text-[11px] leading-none text-primary underline underline-offset-2 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          Share feedback
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="end"
                        sideOffset={8}
                        className="w-80 p-0"
                      >
                        {feedbackStep === "pick" && (
                          <FeedbackPick
                            onPick={(branch) => setFeedbackStep(branch)}
                          />
                        )}
                        {feedbackStep === "positive" && (
                          <FeedbackPositive
                            note={feedbackNote}
                            onNoteChange={setFeedbackNote}
                            share={feedbackShare}
                            onShareChange={setFeedbackShare}
                            onCancel={closeFeedback}
                            onSubmit={handlePositiveSubmit}
                          />
                        )}
                        {feedbackStep === "correction" && (
                          <FeedbackCorrection
                            chips={feedbackChips}
                            onToggleChip={toggleChip}
                            note={feedbackNote}
                            onNoteChange={setFeedbackNote}
                            share={feedbackShare}
                            onShareChange={setFeedbackShare}
                            onCancel={closeFeedback}
                            onSubmit={handleCorrectionSubmit}
                          />
                        )}
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Feedback popover panels
// ---------------------------------------------------------------------------

function FeedbackPick({
  onPick,
}: {
  onPick: (branch: "positive" | "correction") => void;
}) {
  return (
    <div className="p-4">
      <p className="mb-3 text-sm font-medium text-foreground">
        How did the suggested fix do?
      </p>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-md border border-primary bg-primary px-3 py-2.5 text-left text-sm text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          onClick={() => onPick("positive")}
        >
          <Check className="size-4 shrink-0" />
          It got it right
        </button>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          onClick={() => onPick("correction")}
        >
          <Pencil className="size-4 shrink-0 text-muted-foreground" />
          It needs correction
        </button>
      </div>
    </div>
  );
}

function FeedbackPositive({
  note,
  onNoteChange,
  share,
  onShareChange,
  onCancel,
  onSubmit,
}: {
  note: string;
  onNoteChange: (v: string) => void;
  share: boolean;
  onShareChange: (v: boolean) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-sm font-medium text-foreground">
        What did it get right? (optional)
      </p>
      <Textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Describe what worked well…"
        className="min-h-[80px] resize-none text-sm"
      />
      <p className="text-[11px] leading-snug text-muted-foreground">
        Your feedback goes to your admin team.
      </p>
      <label className="flex cursor-pointer items-start gap-2">
        <Checkbox
          checked={share}
          onCheckedChange={(v) => onShareChange(!!v)}
          className="mt-0.5 shrink-0"
        />
        <span className="text-[12px] leading-snug text-muted-foreground">
          Share with UiPath to help improve the product
        </span>
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSubmit}>
          Submit
        </Button>
      </div>
    </div>
  );
}

const CORRECTION_CHIPS: { id: ChipId; label: string }[] = [
  { id: "rule-incorrect", label: "Rule is incorrect" },
  { id: "rule-misapplied", label: "Rule applied incorrectly" },
  { id: "wrong-value", label: "Wrong value used" },
  { id: "value-not-found", label: "Value not found" },
];

function FeedbackCorrection({
  chips,
  onToggleChip,
  note,
  onNoteChange,
  share,
  onShareChange,
  onCancel,
  onSubmit,
}: {
  chips: Set<ChipId>;
  onToggleChip: (id: ChipId) => void;
  note: string;
  onNoteChange: (v: string) => void;
  share: boolean;
  onShareChange: (v: boolean) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-sm font-medium text-foreground">
        What did the suggested fix get wrong?
      </p>
      <div className="flex flex-wrap gap-1.5">
        {CORRECTION_CHIPS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onToggleChip(id)}
            className={`rounded-full border px-2.5 py-1 text-[12px] leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              chips.has(id)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <Textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Other reason, or describe the correct result"
        className="min-h-[80px] resize-none text-sm"
      />
      <div className="flex flex-col gap-1">
        <p className="text-[11px] leading-snug text-muted-foreground">
          Your feedback goes to your admin team.
        </p>
        {/* Flag for design team: proposed pattern addition for agents that act on feedback. */}
        <p className="text-[11px] leading-snug text-muted-foreground/60">
          Suggest solutions will re-run with your input.
        </p>
      </div>
      <label className="flex cursor-pointer items-start gap-2">
        <Checkbox
          checked={share}
          onCheckedChange={(v) => onShareChange(!!v)}
          className="mt-0.5 shrink-0"
        />
        <span className="text-[12px] leading-snug text-muted-foreground">
          Share with UiPath to help troubleshoot and improve the product
        </span>
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSubmit}>
          Submit
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Split button for suggest_po
// ---------------------------------------------------------------------------

interface Candidate {
  po: string;
  evidence: string;
  primary?: boolean;
}

function PoSplitButton({
  suggestion,
  chosenCandidate,
  onCandidateSelect,
  disabled,
  applying,
  onResolve,
}: {
  suggestion: Suggestion;
  chosenCandidate: Candidate | null;
  onCandidateSelect: (c: Candidate) => void;
  disabled?: boolean;
  applying?: boolean;
  onResolve: (s: Suggestion) => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const candidates = suggestion.candidates ?? [];
  const poLabel =
    chosenCandidate?.po ?? (suggestion.data.po as string | undefined) ?? "PO";

  // Build the effective suggestion with the chosen candidate's PO id.
  const effectiveSuggestion: Suggestion = chosenCandidate
    ? { ...suggestion, data: { ...suggestion.data, po: chosenCandidate.po } }
    : suggestion;

  const handleCommit = () => {
    onResolve(effectiveSuggestion);
  };

  return (
    <div className="flex items-stretch overflow-hidden rounded-md">
      {/* Label side — commits the chosen PO. */}
      <Button
        variant="default"
        size="sm"
        disabled={disabled}
        className="rounded-r-none border-r border-primary-foreground/20 shadow-none"
        onClick={handleCommit}
      >
        {applying ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Applying…
          </>
        ) : (
          `Link ${poLabel}`
        )}
      </Button>
      {/* Chevron side — opens candidate list. Only shown when candidates exist. */}
      {candidates.length > 0 && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="default"
              size="sm"
              disabled={disabled}
              aria-label="Choose a different purchase order"
              className="rounded-l-none px-2 shadow-none"
            >
              <ChevronDown className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-1">
            {candidates.map((c) => (
              <button
                key={c.po}
                type="button"
                className="flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onClick={() => {
                  onCandidateSelect(c);
                  setPopoverOpen(false);
                }}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {c.po}
                  {c.primary && (
                    <span
                      className="text-[10px] font-medium"
                      style={{
                        backgroundImage: "var(--ai-gradient-text)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      Best match
                    </span>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="ml-auto text-muted-foreground/40 hover:text-muted-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="size-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Open in source system
                    </TooltipContent>
                  </Tooltip>
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.evidence}
                </span>
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ⋯ overflow menu
// ---------------------------------------------------------------------------

function OverflowMenu({
  disabled,
  onKeepWithoutPo,
}: {
  disabled?: boolean;
  onKeepWithoutPo: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="More options"
          className="text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <button
          type="button"
          className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          onClick={() => {
            setOpen(false);
            onKeepWithoutPo();
          }}
        >
          Keep without a purchase order…
        </button>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Inline attestation confirm
// ---------------------------------------------------------------------------

function AttestConfirm({
  exceptionId,
  onAttest,
  onBack,
  disabled,
}: {
  exceptionId: string;
  onAttest: (record: AttestationRecord) => void;
  onBack: () => void;
  disabled?: boolean;
}) {
  const handleConfirm = () => {
    onAttest({
      findingId: exceptionId,
      kind: "kept-without-po",
      by: "person",
      at: new Date().toISOString(),
    });
  };
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">
          Keep without a purchase order
        </p>
        <p className="mt-1 text-xs leading-normal text-muted-foreground">
          Checks will be re-run. This action will be logged.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={handleConfirm}
        >
          Keep without PO
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled} onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ✕ reject button (lifted verify suggestion)
// ---------------------------------------------------------------------------

/**
 * The ✕ icon at the card's header-right: the "reject suggestion / keep
 * current value" path. Hovering fires the aim ring on the attested field (ring
 * only, no ghost arrow — empty-sentinel correction). Clicking commits through
 * the same resolve path as any fix action.
 */
function RejectButton({
  suggestion,
  disabled,
  onResolve,
  onAim,
}: {
  suggestion: Suggestion;
  disabled?: boolean;
  onResolve: (s: Suggestion) => void;
  onAim?: (correction: DetailCorrections | null) => void;
}) {
  const aim = suggestionAimCorrection(suggestion);
  const label = suggestionLabel(suggestion);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          aria-label={label}
          className="-mr-1 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onResolve(suggestion)}
          onMouseEnter={() => onAim?.(aim)}
          onFocus={() => onAim?.(aim)}
          onMouseLeave={() => onAim?.(null)}
          onBlur={() => onAim?.(null)}
        >
          <X className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Generic action button
// ---------------------------------------------------------------------------

/**
 * A single suggestion action. Internal routes open a confirm dialog naming the
 * owner before parking; a tooltip on hover discloses the full recipient so the
 * button label can stay short ("Send to owner"). Every other action commits on
 * click.
 */
function ActionButton({
  suggestion,
  disabled,
  applying,
  onResolve,
  onAim,
}: {
  suggestion: Suggestion;
  disabled?: boolean;
  applying?: boolean;
  onResolve: (s: Suggestion, reason?: string, note?: string) => void;
  onAim?: (correction: DetailCorrections | null) => void;
}) {
  const isInternalRoute =
    isRouteSuggestion(suggestion) && !isSupplierRoute(suggestion);
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);

  const aim = suggestionAimCorrection(suggestion);
  const handleAim = () => onAim?.(aim);
  const handleClearAim = () => onAim?.(null);

  if (isInternalRoute) {
    const owner = routeOwner(suggestion);
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => setRouteDialogOpen(true)}
              onMouseEnter={handleAim}
              onFocus={handleAim}
              onMouseLeave={handleClearAim}
              onBlur={handleClearAim}
            >
              {suggestionLabel(suggestion)}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {owner.name} · {owner.role}
          </TooltipContent>
        </Tooltip>
        <ReasonDialog
          open={routeDialogOpen}
          onOpenChange={setRouteDialogOpen}
          title={`Route to ${owner.name}`}
          description={owner.role}
          chips={ROUTE_REASONS}
          commitLabel="Route"
          onCommit={(reason, note) => onResolve(suggestion, reason, note)}
        />
      </>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onResolve(suggestion)}
      onMouseEnter={handleAim}
      onFocus={handleAim}
      onMouseLeave={handleClearAim}
      onBlur={handleClearAim}
    >
      {applying ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Applying…
        </>
      ) : (
        suggestionLabel(suggestion)
      )}
    </Button>
  );
}
