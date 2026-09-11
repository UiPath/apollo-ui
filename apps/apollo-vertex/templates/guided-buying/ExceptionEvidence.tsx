"use client";

// Chunk C2: extracted from workbench/WorkbenchDetail.tsx (Sam Rivera's own
// "Group one" — what the exception is), which used to be the only place
// this rendered at all, private and unexported. REQ-10482's decision page
// needed the same evidence for its own "view evidence" links, which had no
// destination to open into before this file existed (see the report).
// Sam's own render site now imports this instead of defining it locally;
// the markup and the data it reads are unchanged, only where the code
// lives moved.

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DEVIATION_BAND_LABEL,
  DEVIATION_BAND_RATIO,
  DEVIATION_METRIC_SUB_LINE,
  DEVIATION_PCT_SIGNED,
  DEVIATION_SCALE_VISIBLE,
  DEVIATION_VERDICT,
  type Exception,
  PAYMENT_TERMS_SOURCES,
  ph,
} from "./data";
import { StructuredTable, type StructuredTableProps } from "./StructuredTable";

/** The price exception's own id (cockpit-10482.ts) — the one exception
 * with a graduated deviation check; every other exception (today, just
 * the terms mismatch) renders as a plain sources table instead. Exported:
 * WorkbenchDetail.tsx's own Group two/three gating (`isPrice`) reads this
 * same constant rather than a second copy of the literal. */
export const PRICE_EXCEPTION_ID = "price-above-benchmark";

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
 * large value, its unit on its own line beneath (the same position and
 * style `suffix` uses for the deviation column's own band line) so the
 * figure stays the prominent thing and the unit never competes with it or
 * forces the value to share a line. */
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
      <span
        className={cn(
          "whitespace-nowrap text-[28px] font-semibold leading-none tracking-tight",
          valueClassName,
        )}
      >
        {value}
      </span>
      {unit != null && (
        <span className="text-xs font-normal text-muted-foreground">
          {unit}
        </span>
      )}
      {suffix != null && (
        <span className="text-xs font-normal text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Proximity to the decision band's own limit, so the reader sees how close
 * the deviation sits rather than comparing two numbers by hand. A position
 * marker, not a fill-to-point: a filled bar reads as progress toward a
 * limit, when this is a position within a range, one side of which happens
 * to be the request's own commercial decision band. */
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

/** The comparison across sources, columns again: `divide-x` between equal
 * columns. `role` marks the governing and deviating sides where the seed
 * says so; a side with no role (e.g. a third source that's merely
 * consistent) renders plain. A role colour marks the value an exception's
 * own decision turns on, not merely a side that differs from another —
 * that's the deviation column alone, a derived figure that only exists
 * because something is open; the ordinary sides carry no colour regardless
 * of `role`. `subLine` is the tooltip on the label, only when a side has
 * one; `unit` is likewise optional. */
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

// The terms exception's own three-source table: source, terms, and which
// typed check value each one carries (PH-45, one placeholder covering all
// three values via its own dynamic label argument, not authored here).
// `status: "warning"` marks only the deviating row.
const TERMS_TABLE: StructuredTableProps = {
  columns: [
    { key: "source", label: "Source", align: "left" },
    { key: "terms", label: "Terms", align: "left" },
    { key: "check", label: "Check", align: "left" },
  ],
  rows: PAYMENT_TERMS_SOURCES.map((s) => ({
    key: s.source,
    cells: {
      source: s.source,
      terms: s.terms,
      check: ph("PH-45", s.check),
    },
    ...(s.check === "deviates" && { status: "warning" as const }),
  })),
};

/** The deviation verdict clause this exception's own headline carries,
 * price exception only ("Price above base benchmark, above the decision
 * band") — exported so each host can compose its own heading treatment
 * (Sam's own `<h2>`, Dana's `DialogTitle`) around the identical clause,
 * rather than this component opinion-ing about heading level or size for
 * every host. */
export function exceptionHeadline(exception: Exception): string {
  return exception.id === PRICE_EXCEPTION_ID
    ? `${exception.headline}, ${DEVIATION_VERDICT}`
    : exception.headline;
}

/**
 * One exception's own finding: the price exception's own metrics grid, or
 * the terms exception's sources table, plus the deviation scale when it
 * earns its place (price exception only, gated on
 * `DEVIATION_SCALE_VISIBLE`). This is the "what was found" presentation
 * Sam's own workbench renders inline, beneath its own headline (see
 * `exceptionHeadline` above); REQ-10482's decision page renders the
 * identical thing inside an overlay instead (see requests/DecisionWindow.tsx),
 * beneath a `DialogTitle` carrying the same headline — same component,
 * same data, two different hosts around it.
 */
export function ExceptionEvidence({ exception }: { exception: Exception }) {
  const isPrice = exception.id === PRICE_EXCEPTION_ID;
  return (
    <div>
      {isPrice ? (
        <ExceptionFinding exception={exception} />
      ) : (
        <StructuredTable {...TERMS_TABLE} />
      )}
      {isPrice && DEVIATION_SCALE_VISIBLE && <DeviationScale />}
    </div>
  );
}
