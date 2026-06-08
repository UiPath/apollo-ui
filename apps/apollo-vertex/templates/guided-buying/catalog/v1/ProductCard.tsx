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
      variant="solid"
      className={cn(
        "h-full gap-3 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md",
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
          <Button variant="ghost" size="sm" onClick={() => onOpenDetail(item)}>
            Details
          </Button>
          <Button
            size="sm"
            variant={featured || inCart ? "default" : "secondary"}
            onClick={() => onToggleCart(item)}
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
                Added
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Add to cart
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
