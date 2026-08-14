"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  CalendarRange,
  Info,
  type LucideIcon,
  Pencil,
  Quote,
  Receipt,
  Tag,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { FieldEditToggle } from "../catalog/v1/InlineFieldEditor";
import {
  buildAnnualLines,
  FIELD_PROVENANCE_LABEL,
  type FieldProvenance,
  IDENTITY,
  PAYMENT_TERMS_SOURCES,
  ph,
  TERM_YEARS,
  TOTAL_CONTRACT_VALUE,
} from "../data";

// Same curve every other inline expansion in this app uses (RequestEnvelope,
// the General Info cost centre row), duplicated locally rather than shared,
// matching how each of those already does it.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function noEdit() {
  // Opens nothing this pass (see the report). Every row shares this single
  // no-op rather than each inventing its own.
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: IDENTITY.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Right-aligned underlined text, matching Details' own provenance
// treatment exactly (see the report). Details' version is a button that
// opens a provenance popover; there's no popover system here, so this is
// the same visual style as plain, non-interactive text.
function ProvenanceLabel({ provenance }: { provenance: FieldProvenance }) {
  return (
    <span className="whitespace-nowrap text-right text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
      {FIELD_PROVENANCE_LABEL[provenance]}
    </span>
  );
}

function EditButton({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={noEdit}
      aria-label={`Edit ${label}`}
      className="text-muted-foreground"
    >
      <Pencil className="size-3.5" aria-hidden />
    </Button>
  );
}

interface FieldRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  provenance: FieldProvenance;
  /** A second, smaller line under the value, Details' own assistant-note
   * pattern for a field where the agent made an assumption. */
  note?: ReactNode;
  /** Replaces the default no-op edit pencil when provided, e.g. the line
   * items row's own expand/collapse control. */
  control?: ReactNode;
}

function FieldRow({
  icon: Icon,
  label,
  value,
  provenance,
  note,
  control,
}: FieldRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
        {note != null && (
          <p className="text-xs text-muted-foreground">{note}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ProvenanceLabel provenance={provenance} />
        {control ?? <EditButton label={label} />}
      </div>
    </div>
  );
}

// The order form v1 source specifically, per its own qualifier. The Net 60
// sources (MSA, vendor master) don't render here, that mismatch is
// procurement's to find on a later screen.
function paymentTermsV1() {
  const source = PAYMENT_TERMS_SOURCES.find(
    (s) => s.source === "Order form v1 · §4",
  );
  if (!source) {
    throw new Error("Order form v1 payment terms source missing from seed");
  }
  return source;
}

// A field row like its siblings: the label names the field (the same
// "Total contract value" label the old total row carried before prompt 11,
// reused rather than reauthored), the value carries the derived total with
// the derived term length as its qualifier, the same "primary · qualifier"
// shape Commodity and Cost centre already use. Its three annual lines sit
// behind the same expand/collapse control Marcus's rows use to disclose
// their options, disclosure rather than editing here, so no selection state
// and no repeated total inside the expansion (see the report).
function LineItemsRow() {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const lines = buildAnnualLines();
  const label = "Total contract value";
  const termQualifier = `${TERM_YEARS}-year term`;

  return (
    <div>
      <FieldRow
        icon={CalendarRange}
        label={label}
        value={`${formatUSD(TOTAL_CONTRACT_VALUE)} · ${termQualifier}`}
        provenance="from-order-form-pricing"
        control={
          <FieldEditToggle
            label={label}
            editing={expanded}
            mode="disclosure"
            onToggle={() => setExpanded((v) => !v)}
          />
        }
      />
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="divide-y divide-border pr-4 pb-2.5 pl-11"
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
            {lines.map((line) => (
              <div
                key={line.year}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-muted-foreground">{`Year ${line.year} · ${line.quantity.toLocaleString("en-US")} licences`}</span>
                <span className="text-muted-foreground">{`${formatUSD(line.unitPrice)}/licence`}</span>
                <span className="font-medium text-foreground">
                  {formatUSD(line.amount)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Step one of the J3 stepper: what the agent read from the order form, for
 * Priya to check before continuing. Conforms to Details' own card, row, and
 * provenance treatment (see the report), rather than the variant this
 * screen invented previously. Every value renders straight from
 * data/req-10482.ts, nothing here is authored request content.
 */
export function ExtractedRequestReview() {
  const terms = paymentTermsV1();

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <AiGlow variant="card" />
        <div
          className={cn(
            GLASS_CLASSES,
            "relative divide-y overflow-hidden rounded-xl bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]",
          )}
        >
          <FieldRow
            icon={Quote}
            label="Request"
            value={IDENTITY.title}
            provenance="from-order-form"
          />
          <FieldRow
            icon={Tag}
            label="Commodity"
            value={IDENTITY.commodity}
            provenance="recognised"
          />
          <LineItemsRow />
          <FieldRow
            icon={Receipt}
            label="Payment terms"
            value={terms.terms}
            provenance="from-order-form"
            note={ph("PH-12")}
          />
          <FieldRow
            icon={Building2}
            label="Cost centre"
            value={IDENTITY.costCentre}
            provenance="from-profile"
          />
        </div>
      </div>

      <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden />
        The output is AI generated. Please review.
      </p>
    </div>
  );
}
