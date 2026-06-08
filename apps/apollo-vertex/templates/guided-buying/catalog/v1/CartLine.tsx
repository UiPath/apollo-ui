import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activePrice, formatPrice } from "./data";
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
  return (
    <div className="flex gap-3 border-b py-4 last:border-b-0">
      <BrandMark item={item} />
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
              Qty {quantity}
            </span>
          ) : (
            <QuantityStepper
              value={quantity}
              onChange={(value) => onQtyChange?.(value)}
            />
          )}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-foreground">
              {formatPrice(activePrice(item, basis) * quantity, item.currency)}
            </span>
            {!readOnly && onRemove && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRemove}
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
