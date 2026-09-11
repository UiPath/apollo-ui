"use client";

import { Building2, Check, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { useAssistantThread } from "../catalog/v1/assistant-thread-context";
import { ph, VENDOR_OPTIONS, type VendorOption } from "../data";
import { useIntakeState } from "./intake-state-context";

const VENDOR_STATUS_LABEL: Record<VendorOption["status"], string> = {
  preferred: "Preferred",
  approved: "Approved",
};

// The comparison content isn't in the seed (see the report). One
// placeholder per alternate vendor so each can be ruled on separately.
const VENDOR_COMPARISON_PLACEHOLDER: Record<string, "PH-24a" | "PH-24b"> = {
  MeetHub: "PH-24a",
  "Vantage AV": "PH-24b",
};

interface VendorRowProps {
  vendor: VendorOption;
  lead: boolean;
  selected: boolean;
  onSelect: () => void;
  /** Alternates only. Opens the AI assistant panel comparing this vendor
   * against the recommended one. */
  onCompareClick?: () => void;
}

/**
 * One vendor row, the same row template Choose's MatchCard uses (icon tile,
 * name + spec + rationale slot, then a status column and actions),
 * mapped onto vendor content per the report's table rather than designed
 * fresh.
 */
function VendorRow({
  vendor,
  lead,
  selected,
  onSelect,
  onCompareClick,
}: VendorRowProps) {
  const rowContent = (
    <>
      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Building2 className="size-6 text-muted-foreground/50" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug text-foreground">
          {vendor.vendor}
        </h3>
        <p className="text-sm text-muted-foreground">{vendor.category}</p>

        <div className="mt-2 min-h-[18px]">
          {lead ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Check className="size-3" aria-hidden />
                {VENDOR_STATUS_LABEL[vendor.status]}
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="size-3" aria-hidden />
                {vendor.contract}
              </span>
            </div>
          ) : (
            <p className="text-xs italic leading-snug text-muted-foreground/70">
              {vendor.consequence}
              {" · "}
              <button
                type="button"
                className="not-italic underline hover:text-foreground"
                onClick={onCompareClick}
              >
                Compare with my pick
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {/* Choose's price sits here; Vendor has none, and status/contract
            already render once as the lead row's own micro-facts, so this
            slot carries only the actions (see the report on the resulting
            balance against Choose's own rows). */}
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm">
            Details
          </Button>
          {selected ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onSelect}
            >
              <Check className="size-4" aria-hidden />
              Selected
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant={lead ? "default" : "secondary"}
              onClick={onSelect}
            >
              Select
            </Button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="relative">
      {lead && <AiGlow variant="card" />}
      <Card
        variant="glass"
        className={cn(
          "relative flex-row items-center gap-4 p-4",
          lead && "bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]",
        )}
      >
        {lead && (
          <Badge
            status="ai"
            variant="default"
            className="absolute -top-[9px] left-4 text-[11px] font-semibold"
          >
            <AiMark size={12} aria-hidden />
            AI pick
          </Badge>
        )}
        {rowContent}
      </Card>
    </div>
  );
}

interface VendorStepProps {
  /** Opens the shared AI assistant panel. The panel itself reads its
   * content from the thread entry seeded by the click that calls this. */
  onOpenComparisonPanel: () => void;
}

/**
 * The Vendor step, the Choose step with vendor content instead of product
 * content. Structure, spacing, and treatment all conform to MatchCarousel
 * rather than inventing a variant, per the report.
 */
export function VendorStep({ onOpenComparisonPanel }: VendorStepProps) {
  const { selectedVendor, vendorConfirmed, selectVendor } = useIntakeState();
  const { addQaEntry } = useAssistantThread();
  const [lead, ...alts] = VENDOR_OPTIONS;

  const compareWithPick = (vendor: VendorOption) => {
    const placeholder = VENDOR_COMPARISON_PLACEHOLDER[vendor.vendor];
    if (!placeholder) return;
    addQaEntry(`Why not ${vendor.vendor}?`, ph(placeholder));
    onOpenComparisonPanel();
  };

  return (
    <div className="w-full">
      <div className="mx-auto mb-8 max-w-prose text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          The{" "}
          <span
            className="inline-block rounded px-1"
            style={{ backgroundImage: "var(--ai-gradient)" }}
          >
            {lead.vendor}
          </span>{" "}
          {ph("PH-13a")}
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {ph("PH-13b")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {ph("PH-13c")}{" "}
          <button type="button" className="underline hover:text-foreground">
            Update my preferences
          </button>
        </p>
      </div>

      <div className="w-full">
        <div className="space-y-3 pt-4 pb-2">
          <VendorRow
            vendor={lead}
            lead
            selected={vendorConfirmed && selectedVendor === lead.vendor}
            onSelect={() => selectVendor(lead)}
          />
          {alts.map((vendor) => (
            <VendorRow
              key={vendor.vendor}
              vendor={vendor}
              lead={false}
              selected={vendorConfirmed && selectedVendor === vendor.vendor}
              onSelect={() => selectVendor(vendor)}
              onCompareClick={() => compareWithPick(vendor)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 px-4 py-4">
          <p className="text-sm font-medium text-foreground">{ph("PH-14")}</p>
        </div>
      </div>

      <p className="flex items-center gap-1.5 px-1 pt-3 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden />
        The output is AI generated. Please review.
      </p>
    </div>
  );
}
