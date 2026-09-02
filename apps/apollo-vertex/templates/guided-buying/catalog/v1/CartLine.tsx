import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activePrice, formatPrice, showsListStrike } from "./data";
import { QuantityStepper } from "./QuantityStepper";
import { BrandMark } from "./ScanRow";
import type { CatalogItem, PriceBasis } from "./types";

interface CartLineProps {
  item: CatalogItem;
  quantity: number;
  basis: PriceBasis;
  /** Read-only mode (Review): shows "Qty N", no stepper/remove. */
  readOnly?: boolean;
  onQtyChange?: (quantity: number) => void;
  onRemove?: () => void;
}

/** A single cart line — editable in the drawer, read-only on Review. */
export function CartLine({
  item,
  quantity,
  basis,
  readOnly = false,
  onQtyChange,
  onRemove,
}: CartLineProps) {
  const unit = activePrice(item, basis);
  const lineTotal = unit * quantity;
  const showStrike = showsListStrike(item, basis);
  return (
    <div className="flex gap-3 border-b py-4 last:border-b-0">
      <BrandMark vendor={item.vendor} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {item.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.specs.join(" · ")}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          {readOnly ? (
            <span className="text-sm text-muted-foreground">
              {quantity} × {formatPrice(unit, item.currency)}
            </span>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <QuantityStepper
                  value={quantity}
                  onChange={(value) => onQtyChange?.(value)}
                />
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRemove}
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
                {/* Unit price alongside the stepper — the visible cause for
                    why the line total below changes with quantity. The
                    struck list price gives the list-price total below its
                    own visible derivation, same order as the shelf cards
                    and the product detail dialog. */}
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {showStrike && (
                    <span className="line-through">
                      {formatPrice(item.listPrice, item.currency)}
                    </span>
                  )}
                  {formatPrice(unit, item.currency)} each
                  {showStrike && ", EPP"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-foreground">
                  {formatPrice(lineTotal, item.currency)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
