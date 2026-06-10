import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { eppSavings, formatPrice } from "./data";
import { ProductCard } from "./ProductCard";
import type { CatalogItem } from "./types";

// The agent's signature gradient — reused (not new) as the promo background.
const AI_GRADIENT = { background: "var(--ai-gradient-strong)" };

interface RecommendationCardProps {
  item: CatalogItem;
  /** Number of alternative picks the agent is holding back. */
  alternatives: number;
  /** Total catalog size, for the "browse all N" line. */
  totalCount: number;
  inCart: boolean;
  quantity: number;
  /** "photo" shows the product image; "logo" shows the brand logo. */
  imageMode?: "photo" | "logo";
  onToggleCart: (item: CatalogItem) => void;
  onOpenDetail: (item: CatalogItem) => void;
}

/**
 * The agent's top pick: an AI-gradient promo panel with the featured product as
 * a solid white card inset inside it — the gradient frames the card like a
 * border. Spans two grid columns on wider screens.
 */
export function RecommendationCard({
  item,
  alternatives,
  totalCount,
  inCart,
  quantity,
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
    <div
      className="overflow-hidden rounded-2xl shadow-sm sm:col-span-2"
      style={AI_GRADIENT}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {/* Promo panel — agent gradient (full-bleed). */}
        <div className="flex flex-col justify-center gap-4 p-6 text-white sm:p-8">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <AutopilotIcon size={16} aria-hidden />
            Best match
          </div>
          <h2 className="text-2xl font-semibold leading-snug">{headline}</h2>
          <p className="text-sm text-white/80">
            {alternatives > 0 &&
              `There ${alternatives === 1 ? "is 1 alternative" : `are ${alternatives} alternatives`} in case the team has preferences. `}
            Or browse all {totalCount} catalog options.
          </p>
        </div>

        {/* Featured product — solid white card, inset so the gradient frames it. */}
        <div className="p-3">
          <ProductCard
            item={item}
            inCart={inCart}
            quantity={quantity}
            featured
            imageMode={imageMode}
            onToggleCart={onToggleCart}
            onOpenDetail={onOpenDetail}
            className="h-full rounded-xl border-0 shadow-none hover:shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
