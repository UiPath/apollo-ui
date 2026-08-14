"use client";

// oxlint-disable max-lines -- the envelope card, its provenance popover, and
// every field's own edit surface live together deliberately (see the report
// on why a split wasn't attempted without more context on this file).

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Info,
  Lock,
  type LucideIcon,
  MapPin,
  MessageSquareText,
  Quote,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { P2 } from "../../P2";
import {
  type DetailField,
  useAssistantThread,
} from "./assistant-thread-context";
import { useConversation } from "./conversation-context";
import { ExceptionModal } from "./ExceptionModal";
import { useFlowFooter } from "./FlowFooter";
import { FieldEditToggle, FieldOptionList } from "./InlineFieldEditor";

// Soft ease-out, matched to the rest of the flow.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
// Calm, visible cadence — each field "resolves" from its source in turn.
const STAGGER = 0.4;

// Need-by is the one low-confidence guess (no date in the ask); the rest are
// confident. This value is both the default and the "assumed" picker option.
const NEED_BY_ASSUMED = "Standard delivery";

type FieldKey = "cost" | "ship" | "need" | "approver";

export interface FieldOption {
  value: string;
  /** One-line reason — the provenance tag, extended into a choice. */
  reason: string;
  /** The agent's low-confidence guess (Need by). */
  assumed?: boolean;
}

// Backs the "Where this came from" popover — see ProvenancePopover below.
// Actions are descriptors, not bound handlers: the render loop resolves each
// kind to a real onClick (it needs setEditingKey/stubToast, which live on
// RequestEnvelope, not on this module-level data).
type ProvenanceActionKind =
  | "changeForRequest"
  | "changeDefault"
  | "requestException";

interface ProvenanceActionSpec {
  label: string;
  variant: "primary" | "secondary";
  kind: ProvenanceActionKind;
}

export interface FieldProvenance {
  /** Zone 2 — the provenance statement itself. */
  source: string;
  /** Zone 3 — supporting detail. Omitted for Need by, which is filled in at
   * render time from the live requestText instead of a static string. */
  context?: string;
  /** Zone 4 lock chip label. Only set when the value can't be changed. */
  lockReason?: string;
  /** The person who owns this field's default, when the lock is a person's
   * (not a policy's — Approver's lock is "Fixed policy rule", no owner).
   * Additive: `source`/`lockReason` above keep their own prose untouched;
   * this is the one structured place the exception modal reads the same
   * name from, so the two surfaces can't drift apart. */
  ownerName?: string;
  /** Zone 4 actions, in display order (right-aligned). */
  actions: ProvenanceActionSpec[];
}

export interface EnvelopeField {
  key: FieldKey;
  icon: LucideIcon;
  label: string;
  /** Where the inference came from — the provenance tag. */
  source: string;
  /** What the agent already reasoned about: current value first, then known alternatives. */
  options: FieldOption[];
  /** Backs the "Where this came from" popover — see FieldProvenance. */
  provenance: FieldProvenance;
}

// Inferred from the established request: "2 ThinkPad X1 laptops for our new
// designers." Mocked values, provenance, and the alternatives the agent knows.
const FIELDS: EnvelopeField[] = [
  {
    key: "cost",
    icon: Building2,
    label: "Cost center",
    source: "From your profile",
    options: [
      {
        value: "Design Operations · CC-4421",
        reason: "On your last 4 requests",
      },
      { value: "Brand · CC-3380", reason: "Brand team's cost center" },
      { value: "Product Design · CC-4410", reason: "Product Design org" },
    ],
    provenance: {
      source: "Pulled from your saved profile default.",
      context:
        "Used on 4 of your last 5 requests. Alternates: Brand · CC-3380, Product Design · CC-4410.",
      actions: [
        {
          label: "Change my default",
          variant: "secondary",
          kind: "changeDefault",
        },
        {
          label: "Change for this request",
          variant: "primary",
          kind: "changeForRequest",
        },
      ],
    },
  },
  {
    key: "ship",
    icon: MapPin,
    label: "Ship to",
    source: "Team default",
    options: [
      {
        value: "Amsterdam office · Herengracht 124, 1015 BS Amsterdam",
        reason: "Your team's default",
      },
      {
        value: "Denver office · 1801 California St, Denver, CO 80202",
        reason: "Your home office",
      },
      {
        value: "Berlin office · Torstraße 100, 10119 Berlin",
        reason: "EU design hub",
      },
    ],
    provenance: {
      source: "Set by Dana Kim as your team's default.",
      context:
        "Used on every team request this quarter. Alternates: your home office, Berlin hub.",
      lockReason: "Only Dana Kim can change",
      ownerName: "Dana Kim",
      actions: [
        {
          label: "Request an exception",
          variant: "secondary",
          kind: "requestException",
        },
      ],
    },
  },
  {
    key: "need",
    icon: CalendarClock,
    label: "Need by",
    source: "From your ask",
    options: [
      {
        value: NEED_BY_ASSUMED,
        reason: "Assumed, since you gave no date",
        assumed: true,
      },
      { value: "By Jun 22", reason: "End of next week" },
      { value: "By Jul 1", reason: "Start of Q3" },
      { value: "Rush · 2 business days", reason: "Fastest, added cost" },
    ],
    provenance: {
      source: "Inferred from your request, which named the Fusion Event.",
      // No static context — built at render time from the live requestText
      // (the quoted phrase needs its own italic span), see the render loop.
      actions: [
        {
          label: "Change for this request",
          variant: "secondary",
          kind: "changeForRequest",
        },
      ],
    },
  },
  {
    key: "approver",
    icon: UserRound,
    label: "Approver",
    source: "Policy threshold",
    options: [
      {
        value: "Alex Chen · Design Director",
        reason: "Owns Design Operations approvals",
      },
      {
        value: "Maya Okonkwo · Brand Director",
        reason: "Owns Brand approvals",
      },
      {
        value: "Sofia Reyes · Product Design Lead",
        reason: "Owns Product Design approvals",
      },
    ],
    provenance: {
      // Invariant — names no role, since the mapped title varies by cost
      // center (Design Director, Brand Director, Product Design Lead) and
      // this string never recomputes. The routed-to name and title live in
      // the derived context below instead (see the render loop).
      source:
        "Policy: catalog orders over $5,000 route to the owner of the cost center it bills to.",
      lockReason: "Fixed policy rule",
      actions: [
        {
          label: "Request an exception",
          variant: "secondary",
          kind: "requestException",
        },
      ],
    },
  },
];

// The showcase cascade: the cost center determines who approves it, so changing
// it re-derives the approver (and the routing line names them).
const COST_TO_APPROVER: Record<string, string> = {
  "Design Operations · CC-4421": "Alex Chen · Design Director",
  "Brand · CC-3380": "Maya Okonkwo · Brand Director",
  "Product Design · CC-4410": "Sofia Reyes · Product Design Lead",
};

const INITIAL_VALUES = Object.fromEntries(
  FIELDS.map((f) => [f.key, f.options[0].value]),
) as Record<FieldKey, string>;

// Field values read "Name · Detail" (cost center, approver) — the short form
// for inline prose, e.g. in the routing consequence note.
function shortName(value: string): string {
  return value.split(" · ")[0];
}

// Seeds the envelope from any fields the user previously overrode (carried
// across a Revise — see reviseRequest/envelopeOverrides) instead of always
// starting from the raw recommendation.
function seedEnvelope(overrides: Record<string, string>): {
  values: Record<FieldKey, string>;
  overridden: Partial<Record<FieldKey, boolean>>;
} {
  const values: Record<FieldKey, string> = { ...INITIAL_VALUES };
  const overridden: Partial<Record<FieldKey, boolean>> = {};
  for (const field of FIELDS) {
    const value = overrides[field.key];
    if (value) {
      values[field.key] = value;
      overridden[field.key] = true;
    }
  }
  // Cascade: cost drives approver, unless the user separately overrode approver.
  if (values.cost !== INITIAL_VALUES.cost && !overrides.approver) {
    const derived = COST_TO_APPROVER[values.cost];
    if (derived) values.approver = derived;
  }
  return { values, overridden };
}

// Stubs for the two actions that don't have a real flow yet — surfaced as an
// info Sonner toast (per the in-product notification guidelines: task-
// generated, tied to this click, no action required) so it still gives
// feedback instead of doing nothing. See the RequestEnvelope doc comment for
// what each would need to actually ship.
function stubToast(title: string, description: string) {
  toast.info(title, { description });
}

interface ProvenancePopoverAction {
  label: string;
  variant: "primary" | "secondary";
  onClick: () => void;
  /** Threaded through from the data-level action spec so the footer can
   * gate the exception action specifically, by kind rather than by label. */
  kind: ProvenanceActionKind;
}

interface ProvenancePopoverProps {
  /** Zone 1, right side — the only echo of the triggering row. Never the value. */
  field: string;
  /** Zone 2 — the provenance statement, the card's visual anchor. */
  source: string;
  /** Zone 3 — supporting detail: usage, alternates, or the inferred phrase. */
  context?: ReactNode;
  /** Zone 4 lock chip label. Presence alone switches the footer to the
   * locked layout (chip left, actions right) instead of actions-only. */
  lockReason?: string;
  /** Zone 4 — right-aligned, in display order (secondary before primary). */
  actions: ProvenancePopoverAction[];
}

function provenanceButtonVariant(action: ProvenancePopoverAction) {
  return action.variant === "primary" ? "default" : "secondary";
}

/** The field's own lock reason, cleared once the requester has overridden
 * the ship-to value (nothing locks a value they've just changed). */
function currentLockReason(
  shipOverridden: boolean | undefined,
  seedLockReason?: string,
): string | undefined {
  if (shipOverridden) return;
  return seedLockReason;
}

/**
 * "Where this came from" popover: a fixed four-zone skeleton reused by every
 * field (Approver, Ship to, Cost center, Need by) so the popover itself never
 * varies, only the data. Zones, always in this order:
 * 1. Header — icon + title, field name right-aligned, hairline border below.
 * 2. Source — the answer to "where did this come from," sized up as the
 *    card's visual anchor.
 * 3. Context — usage/alternates, or (Need by) the inferred phrase.
 * 4. Actions — hairline border above. Three shapes, by what's locked/how many:
 *    - Locked: a lock chip on the left, the (single) action pinned right —
 *      `ml-auto` on the action rather than `justify-between` on the row, so
 *      the action stays right-aligned even if it wraps under a long chip.
 *    - Unlocked, one action: right-aligned alone.
 *    - Unlocked, multiple actions: the two labels don't fit on one line at
 *      this width, so they stack full-width instead of wrapping mid-word;
 *      later entries in `actions` render on top (primary is listed last).
 * Callers own the copy and the action list; this component owns the layout.
 */
function ProvenancePopover({
  field,
  source,
  context,
  lockReason,
  actions,
}: ProvenancePopoverProps) {
  const stacked = !lockReason && actions.length > 1;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b pb-2.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Info
            className="size-[15px] shrink-0 text-muted-foreground"
            aria-hidden
          />
          Where this came from
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {field}
        </span>
      </div>

      <p className="mt-3 text-[15px] font-medium text-foreground">{source}</p>

      {context && (
        <p className="mt-2 text-[13px] text-muted-foreground">{context}</p>
      )}

      <div className="mt-4 border-t pt-4">
        {lockReason ? (
          // The chip takes the remaining width and wraps its own text (rather
          // than the row wrapping the action to a new line), so a long chip
          // and the action stay on one row, vertically centered against
          // however many lines the chip note takes.
          <div className="flex items-center gap-2">
            <span className="flex min-w-0 flex-1 items-start gap-1 text-[11px] text-muted-foreground">
              <Lock className="mt-0.5 size-[11px] shrink-0" aria-hidden />
              <span>{lockReason}</span>
            </span>
            <div className="flex shrink-0 gap-2">
              {actions.map((action) =>
                action.kind === "requestException" ? (
                  <P2 key={action.label}>
                    <Button
                      size="sm"
                      variant={provenanceButtonVariant(action)}
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  </P2>
                ) : (
                  <Button
                    key={action.label}
                    size="sm"
                    variant={provenanceButtonVariant(action)}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex gap-2",
              stacked ? "flex-col-reverse" : "justify-end",
            )}
          >
            {actions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={provenanceButtonVariant(action)}
                className={stacked ? "w-full" : ""}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The Bridge beat: the request envelope Autopilot inferred — cost center,
 * ship-to, need-by, approver — each with provenance + an edit affordance, then
 * Continue. Editing a field opens an agent picker (the current value +
 * alternatives it already reasoned about, each with a reason), not a blank
 * input; the fields are connected, so changing the cost center re-derives the
 * approver, whose row also carries the routing consequence (catalog standard
 * config skips procurement review) as an agent note beneath it. Back and
 * Continue register into the shared FlowFooter rather than rendering inline.
 */
export function RequestEnvelope() {
  const reduceMotion = useReducedMotion();
  const {
    requestText,
    continueToSelection,
    setRequestDetails,
    stepBack,
    reviseRequest,
    revisedFrom,
    clearRevisedFrom,
    envelopeOverrides,
    setEnvelopeOverride,
    clearEnvelopeOverride,
    shipToException,
    setShipToException,
    clearShipToException,
  } = useConversation();
  const [continued, setContinued] = useState(false);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  // Seeded from envelopeOverrides so a Revise re-derives the card without
  // discarding what the user already chose; a first-time Bridge just gets
  // the raw recommendation (overrides start empty).
  const [seed] = useState(() => seedEnvelope(envelopeOverrides));
  // Edits are local to this turn's render (the demo doesn't persist server-side)
  // but reflect immediately — including the cascade into the approver + routing
  // line — and are mirrored into envelopeOverrides so a later Revise keeps them.
  const [values, setValues] = useState<Record<FieldKey, string>>(
    () => seed.values,
  );
  // True for a field the user picked directly (its own picker) — drives the
  // "Changed by you" provenance swap and the revert affordance. A field the
  // cascade moved (e.g. approver, via cost) is NOT marked here: its
  // provenance stays accurate to what actually set it (Policy threshold).
  const [overridden, setOverridden] = useState<
    Partial<Record<FieldKey, boolean>>
  >(() => seed.overridden);
  // Which field's picker is open (one at a time), and a transient flash on the
  // approver when the cascade updates it so the connection is visible. The
  // Request row itself has no picker — see Revise below.
  const [editingKey, setEditingKey] = useState<FieldKey | null>(null);
  // Which field's "Where this came from" popover is open (one at a time,
  // independent of editingKey — opening one closes the other implicitly
  // since only one can render at a spot in the row at a time).
  const [provenanceKey, setProvenanceKey] = useState<FieldKey | null>(null);
  const [approverFlash, setApproverFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const needByAssumed = values.need === NEED_BY_ASSUMED;
  // The cascade moved the approver away from the original recommendation —
  // only true while it's still policy-driven, not a direct user pick.
  const approverCascaded =
    !overridden.approver && values.approver !== INITIAL_VALUES.approver;
  // Cost center's own provenance popover (both zones 2 and 3) is content
  // derived from live state, not the static FIELDS entry — see the render
  // loop below. Alternates come from the map's own keys, never authored,
  // so they can't drift out of sync with what's actually selectable.
  const costAlternates = Object.keys(COST_TO_APPROVER)
    .filter((c) => c !== values.cost)
    .join(", ");
  // Non-null: "ship" is a fixed entry in the module-level FIELDS array.
  const shipField = FIELDS.find((f) => f.key === "ship") as EnvelopeField;

  // Thread entry: live, not gated on Continue, so the panel already has this
  // step's detail the moment Bridge is on screen. Splits records from guesses
  // (see DetailField) so the panel can lead with the assumption instead of
  // just restating the card. Also folds in the one-shot "restated" context
  // right after a Revise — a second addStepEntry call for the same step would
  // just overwrite this one, since entries upsert by step.
  const { addStepEntry } = useAssistantThread();
  useEffect(() => {
    const fields: DetailField[] = FIELDS.map((field) => {
      const assumed = field.key === "need" && needByAssumed;
      return {
        label: field.label,
        value: values[field.key],
        source: assumed
          ? "Assumed"
          : overridden[field.key]
            ? "Changed by you"
            : field.source,
        assumed,
      };
    });
    const assumedCount = fields.filter((f) => f.assumed).length;
    const recordsCount = fields.length - assumedCount;
    const restatedPrefix = revisedFrom ? "Restated. " : "";
    const summary =
      assumedCount > 0
        ? `${restatedPrefix}${fields.length} fields: ${recordsCount} from your records, ${assumedCount} guessed.`
        : `${restatedPrefix}${fields.length} fields, all from your records.`;
    const detail = fields.map((f) => `${f.label}: ${f.value} (${f.source})`);

    addStepEntry("details", summary, detail, fields);
    if (revisedFrom) clearRevisedFrom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, overridden, needByAssumed]);

  const choose = (key: FieldKey, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // Cost center drives the approver — re-derive it on change.
      if (key === "cost") {
        const derived = COST_TO_APPROVER[value];
        if (derived) next.approver = derived;
      }
      return next;
    });
    setOverridden((prev) => {
      const next = { ...prev, [key]: value !== INITIAL_VALUES[key] };
      // Re-derived by the cascade, not a direct pick — provenance stays
      // "Policy threshold" regardless of whether this landed back on the
      // original approver or a different one.
      if (key === "cost") next.approver = false;
      return next;
    });
    // Mirror into envelopeOverrides so a later Revise re-derives the card
    // without losing this pick.
    if (value === INITIAL_VALUES[key]) {
      clearEnvelopeOverride(key);
    } else {
      setEnvelopeOverride(key, value);
    }
    if (key === "cost") {
      // The approver is now cascade-derived, not a direct pick — drop any
      // stale direct override so a later Revise doesn't resurrect it.
      clearEnvelopeOverride("approver");
    }
    // Flash the approver when the cascade actually moved it.
    if (key === "cost" && !reduceMotion) {
      const derived = COST_TO_APPROVER[value];
      if (derived && derived !== values.approver) {
        setApproverFlash(true);
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setApproverFlash(false), 1100);
      }
    }
    setEditingKey(null);
  };

  // Restores the field's recommended value — its provenance and any
  // downstream cascade fall back into place through the same path as a pick.
  const revert = (key: FieldKey) => choose(key, INITIAL_VALUES[key]);

  const onContinue = () => {
    if (continued) return;
    setEditingKey(null);
    setContinued(true);
    // Carry the confirmed routing, cost center, ship-to, and need-by to Review.
    setRequestDetails({
      approver: values.approver,
      costCenter: values.cost,
      shipTo: values.ship,
      needBy: values.need,
    });
    continueToSelection();
  };

  useFlowFooter({
    left: (
      <Button variant="secondary" size="sm" onClick={stepBack}>
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </Button>
    ),
    right: (
      <Button size="sm" onClick={onContinue} disabled={continued}>
        {continued ? (
          <>
            <Check className="size-4" aria-hidden />
            Sourcing…
          </>
        ) : (
          <>
            Continue to selection
            <ArrowRight className="size-4" aria-hidden />
          </>
        )}
      </Button>
    ),
  });

  return (
    <TooltipProvider>
      <div className="w-full space-y-3">
        <div className="relative">
          <AiGlow variant="card" />
          <div
            className={cn(
              GLASS_CLASSES,
              // AI-toolkit guideline (same fix as the lead match card): a
              // glass card paired with a glow needs the higher-opacity
              // ai-glass surface, or the glow bleeds straight through it —
              // GLASS_CLASSES' own default (bg-white/55, dark:bg-white/5.5%)
              // is tuned for a plain card with no glow behind it.
              "relative divide-y overflow-hidden rounded-xl bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]",
            )}
          >
            {/* What the user actually asked for — the anchor the inferences hang
            off, and the only row without a field picker: it's prose, not a
            governed value, so "editing" it means restating it as a new turn
            (Revise) rather than patching text in place. */}
            {requestText && (
              <motion.div
                className="px-4 py-2.5"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <div className="flex items-center gap-3">
                  <Quote
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Request</p>
                    <p className="text-sm font-medium text-foreground">
                      {requestText}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                    From you
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Revise"
                        disabled={continued}
                        onClick={reviseRequest}
                        className="shrink-0 text-muted-foreground"
                      >
                        <MessageSquareText className="size-3.5" aria-hidden />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Revise</TooltipContent>
                  </Tooltip>
                </div>
              </motion.div>
            )}
            {FIELDS.map((field, i) => {
              const Icon = field.icon;
              const isApprover = field.key === "approver";
              // Independent of which allowed value is committed — a pending
              // exception and the picker are two separate axes, not one.
              const shipExceptionPending =
                field.key === "ship" && shipToException != null;
              return (
                <motion.div
                  key={field.label}
                  className={cn(
                    "px-4 py-2.5 transition-colors duration-700",
                    isApprover && approverFlash && "bg-(--primary)/10",
                  )}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: EASE,
                    delay: reduceMotion ? 0 : i * STAGGER,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        {field.label}
                      </p>
                      <p className="truncate text-sm font-medium text-foreground">
                        {values[field.key]}
                      </p>
                      {shipExceptionPending && (
                        <p className="text-xs text-muted-foreground">
                          Ships here if the exception is declined.
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {/* Fixed-width slot regardless of whether this row is
                      overridden, so the provenance label's right edge — and
                      the pencil's x — hold constant across every row. */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Restore recommended ${field.label.toLowerCase()}`}
                        aria-hidden={!overridden[field.key]}
                        tabIndex={overridden[field.key] ? 0 : -1}
                        disabled={continued || !overridden[field.key]}
                        onClick={() => revert(field.key)}
                        className={cn(
                          "text-muted-foreground",
                          !overridden[field.key] && "invisible",
                        )}
                      >
                        <RotateCcw className="size-3.5" aria-hidden />
                      </Button>
                      {field.key === "cost" ? (
                        // Cost center always opens a popover, changed or
                        // not — an overridden field elsewhere in this row
                        // falls back to a plain, non-interactive "Changed
                        // by you" span (see the branch below), but that's
                        // exactly the state this field has the most to say
                        // in, so it keeps the trigger instead of losing it.
                        <Popover
                          open={provenanceKey === field.key}
                          onOpenChange={(open) =>
                            setProvenanceKey(open ? field.key : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <motion.button
                              type="button"
                              disabled={continued}
                              className={cn(
                                "whitespace-nowrap text-right text-xs underline decoration-dotted underline-offset-2 hover:text-foreground",
                                overridden.cost
                                  ? "italic text-(--primary)"
                                  : "text-muted-foreground",
                              )}
                              initial={reduceMotion ? false : { opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                duration: 0.25,
                                delay: reduceMotion ? 0 : i * STAGGER + 0.18,
                              }}
                            >
                              {overridden.cost
                                ? "Changed by you"
                                : field.source}
                            </motion.button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            className="w-80 text-left data-[state=open]:animate-none data-[state=closed]:animate-none"
                          >
                            <ProvenancePopover
                              field={field.label}
                              source={
                                overridden.cost
                                  ? "Changed by you, this request only."
                                  : "Pulled from your saved profile default."
                              }
                              context={
                                overridden.cost
                                  ? `Your default is ${INITIAL_VALUES.cost}. Alternates: ${costAlternates}.`
                                  : `Used on 4 of your last 5 requests. Alternates: ${costAlternates}.`
                              }
                              actions={
                                overridden.cost
                                  ? [
                                      {
                                        label: "Revert",
                                        variant: "primary" as const,
                                        kind: "changeForRequest" as const,
                                        onClick: () => {
                                          setProvenanceKey(null);
                                          revert("cost");
                                        },
                                      },
                                    ]
                                  : field.provenance.actions.map((action) => ({
                                      label: action.label,
                                      variant: action.variant,
                                      kind: action.kind,
                                      onClick: () => {
                                        if (
                                          action.kind === "changeForRequest"
                                        ) {
                                          setProvenanceKey(null);
                                          setEditingKey(field.key);
                                        } else if (
                                          action.kind === "changeDefault"
                                        ) {
                                          stubToast(
                                            "Default not changed",
                                            "Updating your saved profile default isn't available yet.",
                                          );
                                        } else {
                                          stubToast(
                                            "Exception not sent",
                                            "Sending a policy exception request isn't available yet.",
                                          );
                                        }
                                      },
                                    }))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      ) : field.key === "ship" ? (
                        // Ship to also always opens a popover — an allowed
                        // pick (Denver, Berlin) needs no lock, but filing an
                        // exception is a separate axis from which allowed
                        // value is committed, so the trigger can't disappear
                        // the way it does for other overridden fields below.
                        <Popover
                          open={provenanceKey === field.key}
                          onOpenChange={(open) =>
                            setProvenanceKey(open ? field.key : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <motion.button
                              type="button"
                              disabled={continued}
                              className={cn(
                                "whitespace-nowrap text-right text-xs underline decoration-dotted underline-offset-2 hover:text-foreground",
                                overridden.ship
                                  ? "italic text-(--primary)"
                                  : "text-muted-foreground",
                              )}
                              initial={reduceMotion ? false : { opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                duration: 0.25,
                                delay: reduceMotion ? 0 : i * STAGGER + 0.18,
                              }}
                            >
                              {overridden.ship
                                ? "Changed by you"
                                : field.source}
                            </motion.button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            className="w-80 text-left data-[state=open]:animate-none data-[state=closed]:animate-none"
                          >
                            <ProvenancePopover
                              field={field.label}
                              source={
                                overridden.ship
                                  ? "Changed by you, this request only."
                                  : field.provenance.source
                              }
                              lockReason={currentLockReason(
                                overridden.ship,
                                field.provenance.lockReason,
                              )}
                              actions={
                                overridden.ship
                                  ? [
                                      {
                                        label: "Request an exception",
                                        variant: "secondary" as const,
                                        kind: "requestException" as const,
                                        onClick: () => {
                                          setProvenanceKey(null);
                                          setExceptionModalOpen(true);
                                        },
                                      },
                                      {
                                        label: "Revert",
                                        variant: "primary" as const,
                                        kind: "changeForRequest" as const,
                                        onClick: () => {
                                          setProvenanceKey(null);
                                          revert("ship");
                                        },
                                      },
                                    ]
                                  : field.provenance.actions.map((action) => ({
                                      label: action.label,
                                      variant: action.variant,
                                      kind: action.kind,
                                      onClick: () => {
                                        setProvenanceKey(null);
                                        setExceptionModalOpen(true);
                                      },
                                    }))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      ) : overridden[field.key] ? (
                        <motion.span
                          className="whitespace-nowrap text-right text-xs italic text-(--primary)"
                          initial={reduceMotion ? false : { opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 0.25,
                            delay: reduceMotion ? 0 : i * STAGGER + 0.18,
                          }}
                        >
                          Changed by you
                        </motion.span>
                      ) : (
                        <Popover
                          open={provenanceKey === field.key}
                          onOpenChange={(open) =>
                            setProvenanceKey(open ? field.key : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <motion.button
                              type="button"
                              disabled={continued}
                              className="whitespace-nowrap text-right text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                              initial={reduceMotion ? false : { opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                duration: 0.25,
                                delay: reduceMotion ? 0 : i * STAGGER + 0.18,
                              }}
                            >
                              {field.source}
                            </motion.button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            className="w-80 text-left data-[state=open]:animate-none data-[state=closed]:animate-none"
                          >
                            <ProvenancePopover
                              field={field.label}
                              source={field.provenance.source}
                              context={
                                field.key === "need" ? (
                                  <>
                                    Source:{" "}
                                    <span className="italic">
                                      &ldquo;{requestText ?? ""}&rdquo;
                                    </span>
                                    . Contractors start Aug 3, so the need-by is
                                    set to Aug 1.
                                  </>
                                ) : field.key === "approver" ? (
                                  `This request totals $27,735 and bills to ${shortName(values.cost)}, so it routes to ${values.approver}.`
                                ) : (
                                  field.provenance.context
                                )
                              }
                              lockReason={field.provenance.lockReason}
                              actions={field.provenance.actions.map(
                                (action) => ({
                                  label: action.label,
                                  variant: action.variant,
                                  kind: action.kind,
                                  onClick: () => {
                                    if (action.kind === "changeForRequest") {
                                      setProvenanceKey(null);
                                      setEditingKey(field.key);
                                    } else if (
                                      action.kind === "changeDefault"
                                    ) {
                                      stubToast(
                                        "Default not changed",
                                        "Updating your saved profile default isn't available yet.",
                                      );
                                    } else {
                                      // Approver's own requestException action
                                      // (a policy exception, not an owner
                                      // override) — Ship to has its own
                                      // branch above and never reaches here.
                                      stubToast(
                                        "Exception not sent",
                                        "Sending a policy exception request isn't available yet.",
                                      );
                                    }
                                  },
                                }),
                              )}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                      <FieldEditToggle
                        label={field.label}
                        editing={editingKey === field.key}
                        disabled={continued}
                        onToggle={() =>
                          setEditingKey((k) =>
                            k === field.key ? null : field.key,
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Pending exception: subordinate to the row above, which
                  keeps showing what the field actually holds. A rounded
                  border on only one side doesn't render cleanly, hence
                  rounded-none on the block itself. */}
                  {shipExceptionPending && shipToException && (
                    <div className="mt-2 ml-7 space-y-1.5 rounded-none border-l-2 border-warning py-1 pl-3">
                      <Badge variant="secondary" status="warning">
                        Exception requested
                      </Badge>
                      <p className="text-xs font-medium text-foreground">
                        {shipToException.requestedValue}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {`${shipToException.ownerName} decides. Visible to ${shortName(values.approver)} and procurement.`}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={clearShipToException}
                      >
                        Withdraw exception
                      </Button>
                    </div>
                  )}

                  {/* Low-confidence guess: invite a change, quietly. */}
                  {field.key === "need" &&
                    needByAssumed &&
                    editingKey !== "need" && (
                      <p className="mt-1 pl-7 text-xs italic text-muted-foreground/80">
                        {
                          "I assumed standard delivery since you didn't give a date, change it if you need it sooner."
                        }
                      </p>
                    )}

                  {/* Routing consequence — the catalog/standard fork, right under
                  the approver it's about. The name is already in the row
                  above. Once a direct override moves it, "Changed by you"
                  already explains it — no note needed. If the cascade moved
                  it instead, this names the consequence: which cost center
                  routed it away from the original approver. */}
                  {isApprover &&
                    editingKey !== "approver" &&
                    !overridden.approver && (
                      <p className="mt-1 pl-7 text-xs italic text-muted-foreground/80">
                        {approverCascaded
                          ? `${shortName(values.cost)} routes to ${shortName(values.approver)} rather than ${shortName(INITIAL_VALUES.approver)}.`
                          : "Standard catalog config, so this skips procurement review."}
                      </p>
                    )}

                  {/* Agent picker: current value + alternatives it already knows.
                  Closes with the reverse of the open, a touch quicker. */}
                  <FieldOptionList
                    options={field.options}
                    selectedValue={values[field.key]}
                    open={editingKey === field.key}
                    onSelect={(value) => choose(field.key, value)}
                  >
                    {/* Second entry point to the same exception modal —
                    the popover catches "why can't I change this," this
                    catches "I'm already looking for a different value."
                    Deliberately not option-styled (no radio, no border)
                    so it can't be mistaken for a selectable choice — a
                    full-width rule is the only separation, and only the
                    link phrase is interactive. P2 only; an insert after
                    the last option, never a replacement for it. */}
                    <P2>
                      {field.provenance.ownerName != null &&
                        !shipExceptionPending && (
                          <div className="mt-3 space-y-2">
                            <div className="h-px w-full bg-border" />
                            <p className="text-xs text-muted-foreground">
                              {`Need a different ${field.label}?`}{" "}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingKey(null);
                                  setExceptionModalOpen(true);
                                }}
                                className="text-(--primary) underline decoration-dotted underline-offset-2 hover:text-foreground"
                              >
                                Request an exception
                              </button>
                            </p>
                          </div>
                        )}
                    </P2>
                  </FieldOptionList>
                </motion.div>
              );
            })}
          </div>
        </div>

        <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" aria-hidden />
          The output is AI generated. Please review.
        </p>
      </div>

      <ExceptionModal
        field={shipField}
        currentValue={values.ship}
        approverName={shortName(values.approver)}
        open={exceptionModalOpen}
        onOpenChange={setExceptionModalOpen}
        onSubmit={(requestedValue, reason) =>
          setShipToException({
            requestedValue,
            reason,
            ownerName: shipField.provenance.ownerName ?? "",
          })
        }
      />
    </TooltipProvider>
  );
}
