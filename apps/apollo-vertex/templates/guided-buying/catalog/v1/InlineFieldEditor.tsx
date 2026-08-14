"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Extracted from RequestEnvelope.tsx's own field editor (see the report):
// the pencil/Done toggle and the expanding radio option list it opens.
// Everything specific to a given surface's row (the label/value display,
// provenance, per-field notes) stays with that surface; these two pieces
// are the reusable interaction, rendered at whatever point in a row's JSX
// the pencil and the option list belong, same as they already are in
// RequestEnvelope.tsx.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface InlineFieldOption {
  value: string;
  /** One-line reason shown as the option's sub-line. Optional: a
   * self-explanatory value needs no rationale; Marcus's own options all
   * set one today, so his rendering is unchanged either way. */
  reason?: string;
  /** True for the option that was just refused, as opposed to merely
   * unselected. Draws a destructive-colored highlight instead of the
   * normal selected/unselected pair, and never true for more than one
   * option at a time (a refusal doesn't commit, so nothing else changes
   * selected state alongside it). */
  blocked?: boolean;
}

interface FieldEditToggleProps {
  label: string;
  editing: boolean;
  disabled?: boolean;
  onToggle: () => void;
  /** "edit" (default): pencil/check, "Edit {label}"/"Done editing {label}",
   * for a row whose value can be changed. "disclosure": chevron up/down,
   * "Expand {label}"/"Collapse {label}", for a row that only reveals more
   * detail about the same value, nothing to commit. Additive: existing
   * callers render exactly as before, since this defaults to "edit". */
  mode?: "edit" | "disclosure";
}

/** The pencil/Done icon button that opens and closes a field's option list,
 * or (mode="disclosure") the chevron that expands and collapses a row's own
 * detail, same position and interaction, different meaning. */
export function FieldEditToggle({
  label,
  editing,
  disabled,
  onToggle,
  mode = "edit",
}: FieldEditToggleProps) {
  const isDisclosure = mode === "disclosure";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={
            isDisclosure
              ? editing
                ? `Collapse ${label.toLowerCase()}`
                : `Expand ${label.toLowerCase()}`
              : editing
                ? `Done editing ${label.toLowerCase()}`
                : `Edit ${label.toLowerCase()}`
          }
          disabled={disabled}
          onClick={onToggle}
          className="text-muted-foreground"
        >
          {isDisclosure ? (
            editing ? (
              <ChevronUp className="size-3.5" aria-hidden />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden />
            )
          ) : editing ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Pencil className="size-3.5" aria-hidden />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isDisclosure
          ? editing
            ? "Collapse"
            : "Expand"
          : editing
            ? "Done"
            : "Change selection"}
      </TooltipContent>
    </Tooltip>
  );
}

interface FieldOptionListProps {
  options: InlineFieldOption[];
  selectedValue: string;
  open: boolean;
  onSelect: (value: string) => void;
  /** Rendered after the mapped options, inside the same expanding block.
   * RequestEnvelope's own P2-gated "Request an exception" insert uses this
   * rather than the option list needing to know about it. */
  children?: ReactNode;
}

/** The expanding radio-style option list a field's pencil opens: the
 * committed value selected, every option carrying its own reason sub-line. */
export function FieldOptionList({
  options,
  selectedValue,
  open,
  onSelect,
  children,
}: FieldOptionListProps) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
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
          {options.map((opt) => {
            const selected = selectedValue === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left transition-colors",
                  opt.blocked
                    ? "border-destructive bg-destructive/5"
                    : selected
                      ? "border-(--primary) bg-(--primary)/5"
                      : "border-transparent hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                    opt.blocked
                      ? "border-destructive text-destructive"
                      : selected
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
                  {opt.reason != null && (
                    <span
                      className={cn(
                        "block text-xs",
                        opt.blocked
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {opt.reason}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
