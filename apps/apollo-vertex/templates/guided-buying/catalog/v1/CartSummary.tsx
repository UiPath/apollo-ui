import { activePrice, activeSavings, formatPrice } from "./data";
import type { CatalogItem, PriceBasis } from "./types";

interface CartSummaryProps {
  items: CatalogItem[];
  quantities: Record<string, number>;
  basis: PriceBasis;
  /** Bottom-line label — "Subtotal" in the cart, "Total" on Review. */
  totalLabel?: string;
  /** Shows the Items count row. Off on Review, where each line already
   * shows its own quantity and the count would just repeat it. */
  showItemCount?: boolean;
  /** Shows a list-price subtotal row above EPP savings, so the numbers
   * reconcile: subtotal minus savings equals the bottom line. Off by
   * default (the cart's running total has nothing to reconcile against). */
  showSubtotal?: boolean;
}

/** Shared cart totals — subtotal/total, EPP savings, item count. */
export function CartSummary({
  items,
  quantities,
  basis,
  totalLabel = "Subtotal",
  showItemCount = true,
  showSubtotal = false,
}: CartSummaryProps) {
  const count = items.reduce((sum, i) => sum + (quantities[i.id] ?? 0), 0);
  const listSubtotal = items.reduce(
    (sum, i) => sum + i.listPrice * (quantities[i.id] ?? 0),
    0,
  );
  const total = items.reduce(
    (sum, i) => sum + activePrice(i, basis) * (quantities[i.id] ?? 0),
    0,
  );
  const savings = items.reduce(
    (sum, i) => sum + activeSavings(i, basis) * (quantities[i.id] ?? 0),
    0,
  );

  return (
    <div className="space-y-1.5 text-sm">
      {showItemCount && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Items</span>
          <span className="text-foreground">{count}</span>
        </div>
      )}
      {showSubtotal && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">
            {formatPrice(listSubtotal, "USD")}
          </span>
        </div>
      )}
      {savings > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">EPP savings</span>
          <span className="font-medium text-success">
            −{formatPrice(savings, "USD")}
          </span>
        </div>
      )}
      <div className="flex justify-between text-base font-semibold text-foreground">
        <span>{totalLabel}</span>
        <span>{formatPrice(total, "USD")}</span>
      </div>
    </div>
  );
}
