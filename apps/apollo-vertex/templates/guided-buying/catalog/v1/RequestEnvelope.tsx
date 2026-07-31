"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Info,
  type LucideIcon,
  MapPin,
  MessageSquareText,
  Pencil,
  Quote,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  type DetailField,
  useAssistantThread,
} from "./assistant-thread-context";
import { useConversation } from "./conversation-context";
import { useFlowFooter } from "./FlowFooter";

// Soft ease-out, matched to the rest of the flow.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
// Calm, visible cadence — each field "resolves" from its source in turn.
const STAGGER = 0.4;

// Need-by is the one low-confidence guess (no date in the ask); the rest are
// confident. This value is both the default and the "assumed" picker option.
const NEED_BY_ASSUMED = "Standard delivery";

type FieldKey = "cost" | "ship" | "need" | "approver";

interface FieldOption {
  value: string;
  /** One-line reason — the provenance tag, extended into a choice. */
  reason: string;
  /** The agent's low-confidence guess (Need by). */
  assumed?: boolean;
}

interface EnvelopeField {
  key: FieldKey;
  icon: LucideIcon;
  label: string;
  /** Where the inference came from — the provenance tag. */
  source: string;
  /** What the agent already reasoned about: current value first, then known alternatives. */
  options: FieldOption[];
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
  },
  {
    key: "ship",
    icon: MapPin,
    label: "Ship to",
    source: "Team default",
    options: [
      {
        value: "Amsterdam office · Herengracht 124",
        reason: "Your team's default",
      },
      {
        value: "Denver office · 1801 California St",
        reason: "Your home office",
      },
      { value: "Berlin office · Torstraße 100", reason: "EU design hub" },
    ],
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
  } = useConversation();
  const [continued, setContinued] = useState(false);
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

  // Thread entry: live, not gated on Continue, so the panel already has this
  // step's detail the moment Bridge is on screen. Splits records from guesses
  // (see DetailField) so the panel can lead with the assumption instead of
  // just restating the card. Also folds in the one-shot "restated" context
  // right after a Revise — a second addStepEntry call for the same step would
  // just overwrite this one, since entries upsert by step.
  const { addStepEntry } = useAssistantThread();
  useEffect(() => {
    const changedCount = Object.values(overridden).filter(Boolean).length;
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
    if (value !== INITIAL_VALUES[key]) {
      setEnvelopeOverride(key, value);
    } else {
      clearEnvelopeOverride(key);
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
    // Carry the confirmed routing + cost center to Review.
    setRequestDetails({ approver: values.approver, costCenter: values.cost });
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
        <div
          className={cn(GLASS_CLASSES, "divide-y overflow-hidden rounded-xl")}
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
                {/* Same trailing-slot gap (gap-1) as the field rows below, so
                    this text's right edge lines up with theirs instead of
                    sitting a few px further left under the row's own gap-3. */}
                <div className="flex shrink-0 items-center gap-1">
                  <span className="whitespace-nowrap text-right text-xs text-muted-foreground">
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
                        className="text-muted-foreground"
                      >
                        <MessageSquareText className="size-3.5" aria-hidden />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Revise</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </motion.div>
          )}
          {FIELDS.map((field, i) => {
            const Icon = field.icon;
            const isApprover = field.key === "approver";
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
                    <motion.span
                      className={cn(
                        "whitespace-nowrap text-right text-xs",
                        overridden[field.key]
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
                      {overridden[field.key] ? "Changed by you" : field.source}
                    </motion.span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={
                            editingKey === field.key
                              ? `Done editing ${field.label.toLowerCase()}`
                              : `Edit ${field.label.toLowerCase()}`
                          }
                          disabled={continued}
                          onClick={() =>
                            setEditingKey((k) =>
                              k === field.key ? null : field.key,
                            )
                          }
                          className="text-muted-foreground"
                        >
                          {editingKey === field.key ? (
                            <Check className="size-3.5" aria-hidden />
                          ) : (
                            <Pencil className="size-3.5" aria-hidden />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {editingKey === field.key ? "Done" : "Edit"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

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
                <AnimatePresence>
                  {editingKey === field.key && (
                    <motion.div
                      className="mt-2 space-y-1 pl-7"
                      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : {
                              opacity: 0,
                              y: -4,
                              transition: { duration: 0.14, ease: EASE },
                            }
                      }
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      {field.options.map((opt) => {
                        const selected = values[field.key] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => choose(field.key, opt.value)}
                            className={cn(
                              "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left transition-colors",
                              selected
                                ? "border-(--primary) bg-(--primary)/5"
                                : "border-transparent hover:bg-muted",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                                selected
                                  ? "border-(--primary) bg-(--primary) text-white"
                                  : "border-muted-foreground/40",
                              )}
                              aria-hidden
                            >
                              {selected && <Check className="size-2.5" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-foreground">
                                {opt.value}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {opt.reason}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" aria-hidden />
          The output is AI generated. Please review.
        </p>
      </div>
    </TooltipProvider>
  );
}
