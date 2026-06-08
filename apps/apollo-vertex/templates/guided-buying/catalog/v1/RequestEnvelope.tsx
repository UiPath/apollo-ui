"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Info,
  type LucideIcon,
  MapPin,
  Pencil,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConversation } from "./conversation-context";

// Soft ease-out, matched to the rest of the flow.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
// Calm, visible cadence — each field "resolves" from its source in turn.
const STAGGER = 0.4;

const APPROVER = "Alex Chen";

interface EnvelopeField {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Where the inference came from — the provenance tag. */
  source: string;
}

// Inferred from the established request: "2 ThinkPad X1 laptops for our new
// designers." Mocked values + provenance.
const FIELDS: EnvelopeField[] = [
  {
    icon: Building2,
    label: "Cost center",
    value: "Design Operations · CC-4421",
    source: "From your profile",
  },
  {
    icon: MapPin,
    label: "Ship to",
    value: "Amsterdam office · Herengracht 124",
    source: "Team default",
  },
  {
    icon: CalendarClock,
    label: "Need by",
    value: "No date given · standard delivery",
    source: "From your ask",
  },
  {
    icon: UserRound,
    label: "Approver",
    value: `${APPROVER} · Design Director`,
    source: "Policy threshold",
  },
];

/**
 * The Bridge beat: the request envelope Autopilot inferred — cost center,
 * ship-to, need-by, approver — each with provenance + an edit affordance, the
 * routing consequence, then Continue. Inferences made visible, editable,
 * auditable. The fields reveal one at a time (the agent "reading" each source).
 * Edit affordances are visual for v1; wiring is out of scope.
 */
export function RequestEnvelope() {
  const reduceMotion = useReducedMotion();
  const { continueToSelection } = useConversation();
  const [continued, setContinued] = useState(false);

  const onContinue = () => {
    if (continued) return;
    setContinued(true);
    continueToSelection();
  };

  // After the four fields, the routing line, then the CTAs.
  const routingDelay = reduceMotion ? 0 : FIELDS.length * STAGGER;
  const ctaDelay = reduceMotion ? 0 : routingDelay + 0.25;

  return (
    <div className="w-full space-y-3">
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {FIELDS.map((field, i) => {
          const Icon = field.icon;
          return (
            <motion.div
              key={field.label}
              className="flex items-center gap-3 px-4 py-2.5"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                ease: EASE,
                delay: reduceMotion ? 0 : i * STAGGER,
              }}
            >
              <Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="truncate text-sm font-medium text-foreground">
                  {field.value}
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
                aria-label={`Edit ${field.label.toLowerCase()}`}
                className="shrink-0 text-muted-foreground"
              >
                <Pencil className="size-3.5" aria-hidden />
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Routing consequence — where the catalog/standard fork becomes visible. */}
      <motion.div
        className="flex items-start gap-2 px-1 text-xs text-muted-foreground"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE, delay: routingDelay }}
      >
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          Catalog standard config means this routes directly to{" "}
          <span className="font-medium text-foreground">{APPROVER}</span> for
          approval — no procurement review needed.
        </span>
      </motion.div>

      <motion.div
        className="flex items-center justify-end gap-2"
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE, delay: ctaDelay }}
      >
        <Button variant="outline" size="sm" disabled={continued}>
          Adjust details
        </Button>
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
