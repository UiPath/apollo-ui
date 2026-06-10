"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Info,
  type LucideIcon,
  MapPin,
  Pencil,
  Quote,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useConversation } from "./conversation-context";

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

/**
 * The Bridge beat: the request envelope Autopilot inferred — cost center,
 * ship-to, need-by, approver — each with provenance + an edit affordance, the
 * routing consequence, then Continue. Editing a field opens an agent picker
 * (the current value + alternatives it already reasoned about, each with a
 * reason), not a blank input; the fields are connected, so changing the cost
 * center re-derives the approver and recomputes the routing line live.
 */
export function RequestEnvelope() {
  const reduceMotion = useReducedMotion();
  const { requestText, continueToSelection, setRequestDetails } =
    useConversation();
  const [continued, setContinued] = useState(false);
  // Edits are local to this turn (the demo doesn't persist them) but reflect
  // immediately — including the cascade into the approver + routing line.
  const [values, setValues] = useState<Record<FieldKey, string>>(
    () => INITIAL_VALUES,
  );
  // Which field's picker is open (one at a time), and a transient flash on the
  // approver when the cascade updates it so the connection is visible. The
  // request row edits as free text ("request"); the others open a picker.
  const [editingKey, setEditingKey] = useState<FieldKey | "request" | null>(
    null,
  );
  // The request is editable free text (local to this turn, like the fields).
  const [requestValue, setRequestValue] = useState(requestText ?? "");
  const [approverFlash, setApproverFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const approverName = values.approver.split(" · ")[0];
  const needByAssumed = values.need === NEED_BY_ASSUMED;

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

  const onContinue = () => {
    if (continued) return;
    setEditingKey(null);
    setContinued(true);
    // Carry the confirmed routing + cost center to Review.
    setRequestDetails({ approver: values.approver, costCenter: values.cost });
    continueToSelection();
  };

  // After the four fields, the routing line, then the CTAs.
  const routingDelay = reduceMotion ? 0 : FIELDS.length * STAGGER;
  const ctaDelay = reduceMotion ? 0 : routingDelay + 0.25;

  return (
    <div className="w-full space-y-3">
      <div className={cn(GLASS_CLASSES, "divide-y overflow-hidden rounded-xl")}>
        {/* What the user actually asked for — the anchor the inferences hang off. */}
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
                {editingKey === "request" ? (
                  <input
                    type="text"
                    value={requestValue}
                    aria-label="Request"
                    onChange={(e) => setRequestValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingKey(null);
                    }}
                    // biome-ignore lint/a11y/noAutofocus: focus the field the user just opened
                    autoFocus
                    className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {requestValue}
                  </p>
                )}
              </div>
              {editingKey !== "request" && (
                <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                  From you
                </span>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={
                  editingKey === "request"
                    ? "Done editing request"
                    : "Edit request"
                }
                disabled={continued}
                onClick={() =>
                  setEditingKey((k) => (k === "request" ? null : "request"))
                }
                className="shrink-0 text-muted-foreground"
              >
                {editingKey === "request" ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  <Pencil className="size-3.5" aria-hidden />
                )}
              </Button>
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
                isApprover && approverFlash && "bg-[#0f7b8a]/10",
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
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {values[field.key]}
                  </p>
                </div>
                <motion.span
                  className="shrink-0 whitespace-nowrap text-xs text-muted-foreground"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.25,
                    delay: reduceMotion ? 0 : i * STAGGER + 0.18,
                  }}
                >
                  {field.source}
                </motion.span>
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
                    setEditingKey((k) => (k === field.key ? null : field.key))
                  }
                  className="shrink-0 text-muted-foreground"
                >
                  {editingKey === field.key ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    <Pencil className="size-3.5" aria-hidden />
                  )}
                </Button>
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
                              ? "border-[#0f7b8a] bg-[#0f7b8a]/5"
                              : "border-transparent hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                              selected
                                ? "border-[#0f7b8a] bg-[#0f7b8a] text-white"
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

      {/* Routing consequence — where the catalog/standard fork becomes visible.
          Icon + text indented to line up with the card's field rows (px-4, gap-3). */}
      <motion.div
        className="flex items-start gap-3 px-4 text-xs text-muted-foreground"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE, delay: routingDelay }}
      >
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Catalog standard config means this routes directly to{" "}
          <span className="font-medium text-foreground">{approverName}</span>{" "}
          for approval. No procurement review needed.
        </span>
      </motion.div>

      <motion.div
        className="flex items-center justify-end gap-2 pt-2"
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE, delay: ctaDelay }}
      >
        {/* No "Adjust details" — each field is editable inline via its pencil. */}
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
      </motion.div>
    </div>
  );
}
