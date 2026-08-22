import { Check, Plus, X } from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogTitle } from "@/components/ui/dialog";
import {
  activePrice,
  activeSavings,
  formatPrice,
  leadTime,
  priceBasis,
  showsListStrike,
} from "./data";
import { ProductImage } from "./ProductImage";
import { usePriceBasis } from "./price-basis-context";
import { QuantityStepper } from "./QuantityStepper";
import { BrandMark } from "./ScanRow";
import type { CatalogItem } from "./types";

interface ProductDetailProps {
  item: CatalogItem;
  /** Pending quantity to add when the item isn't in the cart yet. */
  defaultQuantity: number;
  /** Live cart quantity (0 if not in cart) — the source of truth once added. */
  cartQuantity: number;
  inCart: boolean;
  comparing: boolean;
  imageMode?: "photo" | "logo";
  onAddToCart: (quantity: number) => void;
  onToggleCompare: () => void;
  onAskAgent: () => void;
}

export function ProductDetail({
  item,
  defaultQuantity,
  cartQuantity,
  inCart,
  comparing,
  imageMode = "photo",
  onAddToCart,
  onToggleCompare,
  onAskAgent,
}: ProductDetailProps) {
  // Pending qty applies before the item is in the cart; once in the cart, the
  // stepper reads and edits the cart quantity directly (single source of truth).
  const [pendingQty, setPendingQty] = useState(defaultQuantity);
  const quantity = inCart ? cartQuantity : pendingQty;
  const onQtyChange = (next: number) =>
    inCart ? onAddToCart(next) : setPendingQty(next);
  const basis = usePriceBasis();
  const showStrike = showsListStrike(item, basis);
  const savings = activeSavings(item, basis);

  return (
    <>
      {/* Header — supplier identity, not page navigation. The close X is
          the dialog's only added dismiss; Esc and scrim click already work
          through the primitive. */}
      <header className="flex items-center gap-2 border-b px-6 py-4">
        <DialogTitle className="sr-only">{item.name}</DialogTitle>
        <BrandMark vendor={item.vendor} />
        <span className="text-sm font-medium text-foreground">
          {item.vendor}
        </span>
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </DialogClose>
      </header>

      <div className="w-full space-y-6 px-6 py-6">
        {/* Two columns: a fixed-width image, then identity/price/actions. */}
        <div className="grid grid-cols-[260px_1fr] gap-6">
          <ProductImage
            src={item.image}
            alt={item.name}
            category={item.category}
            vendor={item.vendor}
            mode={imageMode}
            className="aspect-[4/3] rounded-xl border"
          />

          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {item.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {item.specs.join(" · ")}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(activePrice(item, basis), item.currency)}
                </span>
                {showStrike && (
                  <span className="text-base text-muted-foreground line-through">
                    {formatPrice(item.listPrice, item.currency)}
                  </span>
                )}
              </div>
              {showStrike && (
                <p className="text-sm font-medium text-(--primary)">
                  EPP pricing · save {formatPrice(savings, item.currency)}/unit
                </p>
              )}
            </div>

            {/* One row: stepper, then the primary action. */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <QuantityStepper value={quantity} onChange={onQtyChange} />
              <Button
                variant={inCart ? "outline" : "default"}
                onClick={() => onAddToCart(quantity)}
                aria-pressed={inCart}
              >
                {inCart ? (
                  <>
                    <Check className="size-4" />
                    In cart
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Add {quantity}
                  </>
                )}
              </Button>
            </div>

            {/* Quiet text actions, not full buttons — secondary to the row above. */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <button
                type="button"
                onClick={onToggleCompare}
                aria-pressed={comparing}
                className="text-muted-foreground hover:text-foreground"
              >
                {comparing ? "In compare" : "Add to compare"}
              </button>
              <button
                type="button"
                onClick={onAskAgent}
                className="text-muted-foreground hover:text-foreground"
              >
                Ask about this
              </button>
            </div>
          </div>
        </div>

        {/* Source-of-truth strip — reference content, not a card. A hairline
            above does the separating instead of border/rounded/padding chrome. */}
        <section className="border-t pt-6">
          <h2 className="mb-3 text-base font-medium text-foreground">
            Source &amp; availability
          </h2>
          <dl className="grid grid-cols-4 gap-x-6 gap-y-3">
            <SourceRow label="Source" value={item.source} />
            <SourceRow
              label="Availability"
              value={item.inStock ? "In stock" : "Out of stock"}
            />
            <SourceRow label="Lead time" value={leadTime(item)} />
            <SourceRow
              label="Price basis"
              value={
                basis === "list"
                  ? "List pricing · standard catalog rate"
                  : priceBasis(item)
              }
            />
          </dl>
        </section>

        {/* Full spec breakdown */}
        <section>
          <h2 className="mb-3 text-base font-medium text-foreground">
            Specifications
          </h2>
          {item.specGroups ? (
            <div className="grid gap-x-12 gap-y-4 sm:grid-cols-2">
              {item.specGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-1.5 text-xs font-normal text-muted-foreground">
                    {group.label}
                  </h3>
                  {/* Fixed label column so every value starts at the same
                      x-position across groups, not wherever the longest
                      label in that one group happens to end. */}
                  <dl className="grid grid-cols-[74px_1fr] gap-x-6 gap-y-1 text-sm leading-6">
                    {group.rows.map((row) => (
                      <Fragment key={row.label}>
                        <dt className="text-muted-foreground">{row.label}</dt>
                        <dd className="text-foreground">{row.value}</dd>
                      </Fragment>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {item.specs.map((spec) => (
                <li
                  key={spec}
                  className="rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground"
                >
                  {spec}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function SourceRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-normal text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}
