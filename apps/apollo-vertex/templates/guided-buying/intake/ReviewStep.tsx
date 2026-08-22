"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FieldEditToggle } from "../catalog/v1/InlineFieldEditor";
import { BrandMark } from "../catalog/v1/ScanRow";
import {
  ANNUAL_VALUE,
  buildAnnualLines,
  getPerson,
  IDENTITY,
  ph,
  QUANTITY,
  reviewSummaryLine,
  TERM_YEARS,
  TOTAL_CONTRACT_VALUE,
  UNIT_PRICE_PER_YEAR,
  VENDOR_OPTIONS,
} from "../data";
import { ProvenanceLabel } from "./ExtractedRequestReview";
import { useIntakeState } from "./intake-state-context";
import { JourneyPreview } from "./JourneyPreview";

// Same curve LineItemsRow's own disclosure uses (ExtractedRequestReview.tsx),
// duplicated locally rather than shared, matching how each of that file's
// siblings already does it.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: IDENTITY.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Order summary: an identity row (vendor, what's being bought, extraction
 * provenance — Marcus's own identity row, plus the provenance tag as the
 * counterpart to his savings line), one commitment line for what's being
 * bought with the three-year schedule disclosed rather than always-equal
 * repeated rows (the same FieldEditToggle disclosure LineItemsRow already
 * uses, ExtractedRequestReview.tsx, reused here since Marcus's own
 * CartLine/CartSummary have no multi-year concept to reuse instead — see
 * the report), then the total, unchanged.
 */
function OrderSummaryCard() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const lines = buildAnnualLines();
  const vendor = VENDOR_OPTIONS[0];

  return (
    <div className={cn(GLASS_CLASSES, "p-4")}>
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Order summary
      </h2>

      <div className="mb-3 flex items-center gap-3 rounded-lg border border-border p-3">
        <BrandMark vendor={vendor.vendor} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {vendor.vendor}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {ph(
              "PH-60",
              `${vendor.category} · ${QUANTITY.toLocaleString("en-US")} licenses`,
            )}
          </p>
        </div>
        <ProvenanceLabel provenance="from-order-form" />
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        <div className="flex items-center justify-between px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {`${QUANTITY.toLocaleString("en-US")} licenses · ${TERM_YEARS}-year term`}
          </span>
          <span className="text-muted-foreground">
            {`${formatUSD(UNIT_PRICE_PER_YEAR)}/license/yr`}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {formatUSD(ANNUAL_VALUE)}
            </span>
            <FieldEditToggle
              label="year-by-year schedule"
              editing={scheduleOpen}
              mode="disclosure"
              onToggle={() => setScheduleOpen((v) => !v)}
            />
          </div>
        </div>
        <AnimatePresence>
          {scheduleOpen && (
            <motion.div
              className="divide-y divide-border"
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
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{`Year ${line.year} · ${line.quantity.toLocaleString("en-US")} licenses`}</span>
                  <span className="text-muted-foreground">{`${formatUSD(line.unitPrice)}/license`}</span>
                  <span className="font-medium text-foreground">
                    {formatUSD(line.amount)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-4 text-base font-semibold text-foreground">
        <span>Total</span>
        <span>{formatUSD(TOTAL_CONTRACT_VALUE)}</span>
      </div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}

/** The second, unlabelled card, Marcus's own prose treatment (see the
 * report: his card's frame and FactRow-shaped rows already match this
 * one exactly — the gap was content, a bare value instead of a sentence).
 * Needed from and Data and information aren't named by this pass and stay
 * as they were. */
function FactsCard() {
  const { selectedVendor, linkedAgreement, costCentre, dataInfoValues } =
    useIntakeState();
  return (
    <div className={cn(GLASS_CLASSES, "space-y-3 p-4 text-sm")}>
      <FactRow label="Vendor" value={ph("PH-61", selectedVendor)} />
      <FactRow
        label="Contract"
        value={ph("PH-61", linkedAgreement ?? IDENTITY.agreement)}
      />
      <FactRow
        label="Buying entity"
        value={ph("PH-61", IDENTITY.buyingEntity)}
      />
      <FactRow label="Cost center" value={ph("PH-61", costCentre)} />
      <FactRow label="Currency" value={ph("PH-61", IDENTITY.currency)} />
      <FactRow label="Needed from" value={IDENTITY.neededFrom} />
      <FactRow
        label="Data and information"
        value={reviewSummaryLine(dataInfoValues)}
      />
    </div>
  );
}

/**
 * Review, the fifth phase: everything Priya has assembled, plus what
 * happens on submit. Conforms to Marcus's Review anatomy (see the report):
 * outcome heading, Order summary card, an unlabelled facts card, then J3's
 * own addition, the assembled journey (the model's second render, reusing
 * Data and Info's own JourneyPreview rather than a second renderer).
 *
 * Chronology: nothing here reads the benchmark, deviation, rate lock,
 * payment-terms correction, or any exception — all of those are Sam
 * Rivera's own post-submit discoveries (see the report on
 * data/cockpit-10482.ts), which don't exist yet at this point in Priya's
 * own journey.
 */
export function ReviewStep() {
  const { journeyAnswers } = useIntakeState();
  const dana = getPerson("dana-kim");

  return (
    <div className="mx-auto w-full max-w-[640px] space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold leading-snug text-foreground">
          {ph("PH-19a", `Routes through procurement to ${dana.name}`)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ph(
            "PH-19b",
            `Procurement review required before ${dana.name} decides`,
          )}
        </p>
      </div>

      <OrderSummaryCard />
      <FactsCard />

      <div>
        <p className="mb-3 text-xs font-semibold text-muted-foreground">
          Assembled journey
        </p>
        <JourneyPreview answers={journeyAnswers} variant="timeline" />
      </div>
    </div>
  );
}
