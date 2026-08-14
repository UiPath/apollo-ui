"use client";

import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  buildAnnualLines,
  IDENTITY,
  ph,
  reviewSummaryLine,
  TOTAL_CONTRACT_VALUE,
} from "../data";
import { useIntakeState } from "./intake-state-context";
import { JourneyPreview } from "./JourneyPreview";

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: IDENTITY.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Order summary: the same generated annual lines Details' own LineItems
 * renders (see the report), inside Marcus's Order summary card frame. No
 * stepper or delete control, since that rendering never had one, being a
 * compact rate table rather than a cart-item card. */
function OrderSummaryCard() {
  const lines = buildAnnualLines();
  return (
    <div className={cn(GLASS_CLASSES, "p-4")}>
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Order summary
      </h2>
      <div className="divide-y divide-border rounded-lg border border-border">
        {lines.map((line) => (
          <div
            key={line.year}
            className="flex items-center justify-between px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">{`Year ${line.year} · ${line.quantity.toLocaleString("en-US")} licences`}</span>
            <span className="text-muted-foreground">{`${formatUSD(line.unitPrice)}/licence`}</span>
            <span className="font-medium text-foreground">
              {formatUSD(line.amount)}
            </span>
          </div>
        ))}
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

/** The second, unlabelled card: label/value pairs, every value from the
 * seed or from state earlier steps set (see the report's source mapping). */
function FactsCard() {
  const { selectedVendor, linkedAgreement, costCentre, dataInfoValues } =
    useIntakeState();
  return (
    <div className={cn(GLASS_CLASSES, "space-y-3 p-4 text-sm")}>
      <FactRow label="Vendor" value={selectedVendor} />
      <FactRow label="Contract" value={linkedAgreement ?? IDENTITY.agreement} />
      <FactRow label="Buying entity" value={IDENTITY.buyingEntity} />
      <FactRow label="Cost centre" value={costCentre} />
      <FactRow label="Currency" value={IDENTITY.currency} />
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
 */
export function ReviewStep() {
  const { journeyAnswers } = useIntakeState();

  return (
    <div className="mx-auto w-full max-w-[640px] space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold leading-snug text-foreground">
          {ph("PH-19a")}
        </h1>
        <p className="text-sm text-muted-foreground">{ph("PH-19b")}</p>
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
