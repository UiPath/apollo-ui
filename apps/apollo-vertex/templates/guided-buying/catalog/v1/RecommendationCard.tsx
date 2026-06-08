import { Sparkles } from "lucide-react";
import { eppSavings, formatPrice } from "./data";
import { ProductCard } from "./ProductCard";
import type { CatalogItem } from "./types";

interface RecommendationCardProps {
  item: CatalogItem;
  /** Number of alternative picks the agent is holding back. */
  alternatives: number;
  /** Total catalog size, for the "browse all N" line. */
  totalCount: number;
  inCart: boolean;
  /** "photo" shows the product image; "logo" shows the brand logo. */
  imageMode?: "photo" | "logo";
  onToggleCart: (item: CatalogItem) => void;
  onOpenDetail: (item: CatalogItem) => void;
}

/**
 * The agent's top pick: a gradient promo panel fused with the featured product
 * tile, framed as one highlighted unit. Spans two grid columns on wider screens.
 */
export function RecommendationCard({
  item,
  alternatives,
  totalCount,
  inCart,
  imageMode = "photo",
  onToggleCart,
  onOpenDetail,
}: RecommendationCardProps) {
  const savings = eppSavings(item);
  const headline =
    savings > 0
      ? `${item.name} matches your request — ${formatPrice(savings, item.currency)} cheaper per unit with EPP applied`
      : `${item.name} is the best match for your request`;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-cyan-400/70 shadow-sm sm:col-span-2">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {/* Promo panel */}
        <div className="flex flex-col justify-center gap-4 bg-gradient-to-br from-[#6d5cd6] to-[#3b5bdb] p-6 text-white">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-4" aria-hidden />
            Picked for you
          </div>
          <h2 className="text-2xl font-semibold leading-snug">{headline}</h2>
          <p className="text-sm text-white/80">
            {alternatives > 0 &&
              `There ${alternatives === 1 ? "is 1 alternative" : `are ${alternatives} alternatives`} in case the team has preferences. `}
            Or browse all {totalCount} catalog options.
          </p>
        </div>

        {/* Featured product — borderless so the outer frame reads as one unit */}
        <ProductCard
          item={item}
          inCart={inCart}
          featured
          imageMode={imageMode}
          onToggleCart={onToggleCart}
          onOpenDetail={onOpenDetail}
          className="rounded-none border-0 shadow-none hover:shadow-none"
        />
      </div>
    </div>
  );
}
