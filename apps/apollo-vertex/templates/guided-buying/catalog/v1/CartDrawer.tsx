import { ShieldCheck, ShoppingCart, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-context";
import { CartLine } from "./CartLine";
import { CartSummary } from "./CartSummary";
import { activePrice, APPROVAL_LIMIT } from "./data";
import { usePriceBasis } from "./price-basis-context";

interface CartDrawerProps {
  /** Advances to the Review step (Selection navigates the router). */
  onReviewSubmit: () => void;
}

/** Standard right-edge cart peek drawer (built on Sheet, fed by cart context). */
export function CartDrawer({ onReviewSubmit }: CartDrawerProps) {
  const { open, setOpen, items, quantities, count, setQuantity, remove } =
    useCart();
  const basis = usePriceBasis();
  const subtotal = items.reduce(
    (sum, i) => sum + activePrice(i, basis) * (quantities[i.id] ?? 0),
    0,
  );
  const needsApproval = subtotal > APPROVAL_LIMIT;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Cart{count > 0 ? ` · ${count}` : ""}</SheetTitle>
          <SheetDescription className="sr-only">
            Items selected for purchase
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingCart
              className="size-8 text-muted-foreground/50"
              aria-hidden
            />
            <div>
              <p className="font-medium text-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Browse the catalog to add items.
              </p>
            </div>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Browse catalog
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              {items.map((item) => (
                <CartLine
                  key={item.id}
                  item={item}
                  quantity={quantities[item.id] ?? 1}
                  basis={basis}
                  onQtyChange={(quantity) => setQuantity(item, quantity)}
                  onRemove={() => remove(item)}
                />
              ))}
            </div>

            <SheetFooter className="gap-3 border-t">
              <CartSummary
                items={items}
                quantities={quantities}
                basis={basis}
              />

              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  needsApproval ? "text-warning" : "text-muted-foreground",
                )}
              >
                {needsApproval ? (
                  <TriangleAlert className="size-3.5" aria-hidden />
                ) : (
                  <ShieldCheck className="size-3.5" aria-hidden />
                )}
                {needsApproval
                  ? "Needs manager approval"
                  : "Within your approval limit"}
              </div>

              <Button className="w-full" onClick={onReviewSubmit}>
                Review &amp; submit
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Keep browsing
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
