import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  activePrice,
  formatPrice,
  showsListStrike,
  vendorLogoUrl,
} from "./data";
import { usePriceBasis } from "./price-basis-context";
import type { CatalogItem } from "./types";

// Shared teal accent (already used by the featured card + escalation banner).
const ACCENT = "bg-[#0f7b8a] text-white hover:bg-[#0c6976]";
// Vibrant AI gradient (readable with white text), used for the picked-for-you
// row's border and badge.
const AI_GRADIENT = { background: "var(--ai-gradient-strong)" };

interface ScanRowProps {
  item: CatalogItem;
  inCart: boolean;
  /** Quantity shown on the Add button (request qty, or cart qty once added). */
  quantity: number;
  comparing: boolean;
  /** Elevated "Picked for you" lead row. */
  recommended?: boolean;
  /** Agent rationale shown under the name on the recommended row. */
  note?: string;
  onToggleCart: (item: CatalogItem) => void;
  onToggleCompare: (item: CatalogItem) => void;
  onOpenDetail: (item: CatalogItem) => void;
}

/** Small brand mark — logo when available, vendor initials on missing/broken. */
export function BrandMark({ item }: { item: CatalogItem }) {
  const logo = vendorLogoUrl(item.vendor);
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
      {logo && !failed ? (
        // oxlint-disable-next-line next/no-img-element
        <img
          src={logo}
          alt={`${item.vendor} logo`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-5 object-contain"
        />
      ) : (
        <span className="text-[10px] font-semibold text-muted-foreground">
          {item.vendor.slice(0, 3).toUpperCase()}
        </span>
      )}
    </div>
  );
}

/** A single catalog item rendered as a scannable horizontal row. */
export function ScanRow({
  item,
  inCart,
  quantity,
  comparing,
  recommended = false,
  note,
  onToggleCart,
  onToggleCompare,
  onOpenDetail,
}: ScanRowProps) {
  const basis = usePriceBasis();
  const showStrike = showsListStrike(item, basis);
  const stockLine = `${item.inStock ? "In stock" : "Out of stock"} · ${item.source}`;

  return (
    // Recommended row gets an AI-gradient glow behind it (no border).
    <div className="relative">
      {recommended && (
        <div
          className="pointer-events-none absolute -inset-0.5 rounded-xl opacity-15 blur-md"
          style={AI_GRADIENT}
          aria-hidden
        />
      )}
      <div
        role="button"
        tabIndex={0}
        aria-label={`View ${item.name} details`}
        onClick={() => onOpenDetail(item)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenDetail(item);
          }
        }}
        className={cn(
          "relative flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 rounded-lg p-4 transition-shadow hover:shadow-md",
          recommended ? "border bg-card" : cn(...GLASS_CLASSES, "rounded-lg"),
        )}
      >
        <Checkbox
          checked={comparing}
          onCheckedChange={() => onToggleCompare(item)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Compare ${item.name}`}
          className="shrink-0"
        />

        <BrandMark item={item} />

        <div className="min-w-48 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-foreground">{item.name}</h3>
            {recommended && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={AI_GRADIENT}
              >
                <AutopilotIcon size={12} aria-hidden />
                Picked for you
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {item.specs.join(" · ")}
          </p>
          {recommended && note && (
            <p className="mt-0.5 text-sm font-medium text-[#0f7b8a]">{note}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-2">
              <span className="text-lg font-semibold text-foreground">
                {formatPrice(activePrice(item, basis), item.currency)}
              </span>
              {showStrike && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(item.listPrice, item.currency)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{stockLine}</p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={
                inCart ? "outline" : recommended ? "default" : "secondary"
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleCart(item);
              }}
              aria-pressed={inCart}
              className={cn(!inCart && recommended && ACCENT)}
            >
              {inCart ? (
                <>
                  <Check className="size-4" />
                  {quantity} added
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  {quantity > 1 ? `Add ${quantity}` : "Add"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
