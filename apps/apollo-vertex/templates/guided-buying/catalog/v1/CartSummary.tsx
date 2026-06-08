import { activePrice, activeSavings, formatPrice } from "./data";
import type { CatalogItem, PriceBasis } from "./types";

interface CartSummaryProps {
  items: CatalogItem[];
  quantities: Record<string, number>;
  basis: PriceBasis;
  /** Bottom-line label — "Subtotal" in the cart, "Total" on Review. */
  totalLabel?: string;
}

/** Shared cart totals — subtotal/total, EPP savings, item count. */
export function CartSummary({
  items,
  quantities,
  basis,
  totalLabel = "Subtotal",
}: CartSummaryProps) {
  const count = items.reduce((sum, i) => sum + (quantities[i.id] ?? 0), 0);
  const subtotal = items.reduce(
    (sum, i) => sum + activePrice(i, basis) * (quantities[i.id] ?? 0),
    0,
  );
  const savings = items.reduce(
    (sum, i) => sum + activeSavings(i, basis) * (quantities[i.id] ?? 0),
    0,
  );

  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Items</span>
        <span className="text-foreground">{count}</span>
      </div>
      {savings > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">EPP savings</span>
          <span className="font-medium text-[#0f7b8a]">
            −{formatPrice(savings, "USD")}
          </span>
        </div>
      )}
      <div className="flex justify-between text-base font-semibold text-foreground">
        <span>{totalLabel}</span>
        <span>{formatPrice(subtotal, "USD")}</span>
      </div>
    </div>
  );
}
