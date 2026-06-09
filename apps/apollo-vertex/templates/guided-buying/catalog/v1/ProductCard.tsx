import { Check, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { activePrice, formatPrice, showsListStrike } from "./data";
import { usePriceBasis } from "./price-basis-context";
import { ProductImage } from "./ProductImage";
import type { CatalogItem } from "./types";

interface ProductCardProps {
  item: CatalogItem;
  inCart: boolean;
  /** Quantity shown on the Add button (request qty, or cart qty once added). */
  quantity: number;
  /** Featured (recommended) styling: teal Add-to-cart accent. */
  featured?: boolean;
  /** "photo" shows the product image; "logo" shows the brand logo. */
  imageMode?: "photo" | "logo";
  onToggleCart: (item: CatalogItem) => void;
  onOpenDetail: (item: CatalogItem) => void;
  /** Optional override for the container (used when nested in the rec card). */
  className?: string;
}

export function ProductCard({
  item,
  inCart,
  quantity,
  featured = false,
  imageMode = "photo",
  onToggleCart,
  onOpenDetail,
  className,
}: ProductCardProps) {
  const basis = usePriceBasis();
  const showStrike = showsListStrike(item, basis);

  return (
    <Card
      variant={featured ? "solid" : "glass"}
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
        "h-full cursor-pointer gap-3 p-4 transition-shadow hover:shadow-md",
        className,
      )}
    >
      {/* Tier + source chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-normal">
          {item.tier}
        </Badge>
        <Badge variant="secondary" className="font-normal">
          <Check className="size-3" aria-hidden />
          {item.source}
        </Badge>
      </div>

      <ProductImage
        src={item.image}
        alt={item.name}
        category={item.category}
        vendor={item.vendor}
        mode={imageMode}
        className="h-40 rounded-xl"
      />

      <div className="space-y-0.5">
        <h3 className="font-semibold leading-snug text-foreground">
          {item.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {item.specs.join(" | ")}
        </p>
      </div>

      <div className="mt-auto space-y-3 pt-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(activePrice(item, basis), item.currency)}
          </span>
          {showStrike && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(item.listPrice, item.currency)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant={featured || inCart ? "default" : "secondary"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCart(item);
            }}
            aria-pressed={inCart}
            className={cn(
              featured &&
                !inCart &&
                "bg-[#0f7b8a] text-white hover:bg-[#0c6976]",
            )}
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
    </Card>
  );
}
