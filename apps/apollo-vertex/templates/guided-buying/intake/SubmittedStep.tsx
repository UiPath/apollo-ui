"use client";

import { useReducedMotion } from "framer-motion";
import { Clock } from "lucide-react";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ConfirmCheck } from "../ConfirmCheck";
import { IDENTITY, ph, TOTAL_CONTRACT_VALUE } from "../data";
import { useIntakeState } from "./intake-state-context";
import { JourneyPreview } from "./JourneyPreview";

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: IDENTITY.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * The submitted state, reached from Review's Submit: the flow's terminal
 * phase. Conforms to Marcus's Done screen (see the report): confirmation
 * mark, outcome heading, one card (id, what was requested, progress,
 * summary facts), a waiting note, then the footer's two actions.
 */
export function SubmittedStep() {
  const reduceMotion = useReducedMotion();
  const { selectedVendor, linkedAgreement, costCentre, journeyAnswers } =
    useIntakeState();

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <ConfirmCheck reduceMotion={reduceMotion} />

      <h1 className="mt-4 text-center text-2xl font-semibold tracking-tight text-foreground">
        {ph("PH-21a")}
      </h1>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">
        {ph("PH-21b")}
      </p>

      <div className={cn(GLASS_CLASSES, "mt-6 p-4 text-sm")}>
        <p className="text-xs text-muted-foreground">Request {IDENTITY.id}</p>
        <p className="mt-3 truncate text-xl font-semibold tracking-tight text-foreground">
          {IDENTITY.title}
        </p>

        <div className="mt-4 border-t pt-4">
          <JourneyPreview answers={journeyAnswers} variant="block" />
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3 shrink-0" aria-hidden />
            {ph("PH-22")}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-medium text-foreground">
              {formatUSD(TOTAL_CONTRACT_VALUE)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cost centre</p>
            <p className="font-medium text-foreground">{costCentre}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vendor</p>
            <p className="font-medium text-foreground">
              {selectedVendor} · {linkedAgreement ?? IDENTITY.agreement}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
