"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "./cart-context";
import {
  activePrice,
  CATALOG_ITEMS,
  defaultQuantityFor,
  formatPrice,
} from "./data";
import { QuantityStepper } from "./QuantityStepper";
import { BrandMark } from "./ScanRow";

interface AddItemsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Same basis as Review and the cart itself — this drawer only ever adds to
// that same order, so it prices the same way.
const BASIS = "epp" as const;

/**
 * "Add items from the catalog" — a lightweight browse-and-add surface over
 * Review, not the full Selection page (no toolbar, filters, or compare;
 * this is topping off an order already made, not shopping from scratch).
 * Opens as a drawer so adding an item never navigates away from Review.
 */
export function AddItemsDrawer({ open, onOpenChange }: AddItemsDrawerProps) {
  const { quantities, setQuantity } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Add items</SheetTitle>
          <SheetDescription className="sr-only">
            Browse the catalog and add items to this request
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          {CATALOG_ITEMS.map((item) => {
            const qty = quantities[item.id] ?? 0;
            return (
              <div
                key={item.id}
                className="flex gap-3 border-b py-4 last:border-b-0"
              >
                <BrandMark item={item} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.specs.join(" · ")}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatPrice(activePrice(item, BASIS), item.currency)}{" "}
                      each
                    </span>
                    {qty > 0 ? (
                      <QuantityStepper
                        value={qty}
                        onChange={(value) => setQuantity(item, value)}
                        min={0}
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setQuantity(item, defaultQuantityFor(item))
                        }
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
