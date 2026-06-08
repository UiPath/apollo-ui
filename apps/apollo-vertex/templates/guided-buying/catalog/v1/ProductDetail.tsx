import { ArrowLeft, Check, Columns3, Plus } from "lucide-react";
import { type ReactNode, useState } from "react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  activePrice,
  activeSavings,
  formatPrice,
  leadTime,
  priceBasis,
  showsListStrike,
} from "./data";
import { usePriceBasis } from "./price-basis-context";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";
import { BrandMark } from "./ScanRow";
import type { CatalogItem } from "./types";

const ACCENT = "bg-[#0f7b8a] text-white hover:bg-[#0c6976]";

interface ProductDetailProps {
  item: CatalogItem;
  defaultQuantity: number;
  inCart: boolean;
  comparing: boolean;
  isPicked: boolean;
  recommendationNote: string;
  imageMode?: "photo" | "logo";
  onAddToCart: (quantity: number) => void;
  onToggleCompare: () => void;
  onAskAgent: () => void;
  onClose: () => void;
}

export function ProductDetail({
  item,
  defaultQuantity,
  inCart,
  comparing,
  isPicked,
  recommendationNote,
  imageMode = "photo",
  onAddToCart,
  onToggleCompare,
  onAskAgent,
  onClose,
}: ProductDetailProps) {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const basis = usePriceBasis();
  const showStrike = showsListStrike(item, basis);
  const savings = activeSavings(item, basis);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-6 py-3 backdrop-blur">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Back to catalog"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <button
            type="button"
            onClick={onClose}
            className="hover:text-foreground"
          >
            Catalog
          </button>
          <span className="px-1.5">/</span>
          <span className="text-foreground">{item.name}</span>
        </nav>
      </header>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-6">
        {/* Top: image + identity/price */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ProductImage
            src={item.image}
            alt={item.name}
            category={item.category}
            vendor={item.vendor}
            mode={imageMode}
            className="aspect-[4/3] rounded-xl border"
          />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <BrandMark item={item} />
              <span className="text-sm text-muted-foreground">
                {item.vendor}
              </span>
            </div>
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
                <p className="text-sm font-medium text-[#0f7b8a]">
                  EPP pricing · save {formatPrice(savings, item.currency)}/unit
                </p>
              )}
            </div>

            {isPicked && (
              <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3">
                <AutopilotIcon
                  size={16}
                  className="mt-0.5 shrink-0 text-[#0f7b8a]"
                  aria-hidden
                />
                <p className="text-sm text-foreground">{recommendationNote}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <QuantityStepper value={quantity} onChange={setQuantity} />
              <Button
                variant={inCart ? "outline" : "default"}
                className={cn(!inCart && ACCENT)}
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
                    Add to cart
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleCompare}
                aria-pressed={comparing}
              >
                <Columns3 className="size-4" />
                {comparing ? "In compare" : "Add to compare"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onAskAgent}>
                <AutopilotIcon size={14} aria-hidden />
                Ask the agent about this
              </Button>
            </div>
          </div>
        </div>

        {/* Source-of-truth panel */}
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Source &amp; availability
          </h2>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
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
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Specifications
          </h2>
          {item.specGroups ? (
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {item.specGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h3>
                  <dl className="space-y-1.5">
                    {group.rows.map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between gap-4 text-sm"
                      >
                        <dt className="text-muted-foreground">{row.label}</dt>
                        <dd className="text-right text-foreground">
                          {row.value}
                        </dd>
                      </div>
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
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
