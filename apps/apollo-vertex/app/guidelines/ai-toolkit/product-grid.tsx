import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AiCaveat } from "@/registry/ai-caveat/ai-caveat";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiIcon } from "./ai-icon";

// Text-safe gradient fill (white text, AA) for the "Best match" badge.
const FILL = "var(--ai-gradient-fill)";
// Accessible gradient for the clipped-text reason line (lifts in dark mode).
const TEXT_GRADIENT = "var(--ai-gradient-text)";

type Product = {
  name: string;
  spec: string;
  image: string;
  price: string;
  was: string;
  cta: string;
  // The AI recommendation gets the gradient shadow, badge, and reasoning line.
  ai?: boolean;
  reason?: string;
};

const PRODUCTS: Product[] = [
  {
    name: 'MacBook Pro 14"',
    spec: 'M4 Pro · 14" Liquid Retina XDR · 24GB · 1TB',
    image:
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80",
    price: "$1,999",
    was: "$2,199",
    cta: "Add to cart",
    ai: true,
    reason: "Matches your request · $200/unit cheaper with EPP applied",
  },
  {
    name: 'MacBook Pro 16"',
    spec: 'M4 Max · 16" Liquid Retina XDR · 36GB · 1TB',
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
    price: "$2,499",
    was: "$2,899",
    cta: "Add to cart",
  },
  {
    name: 'MacBook Air 15"',
    spec: 'M3 · 15" Liquid Retina · 16GB · 512GB',
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=600&q=80",
    price: "$1,499",
    was: "$1,699",
    cta: "Add to cart",
  },
];

function ProductCard({ product }: { product: Product }) {
  return (
    <Card
      variant="glass"
      className="relative flex h-full flex-col gap-3 overflow-hidden bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)] p-3"
    >
      <div className="relative">
        {/* biome-ignore lint/performance/noImgElement: external demo imagery, matches the aspect-ratio docs */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="aspect-[4/3] w-full rounded-xl object-cover"
        />
        {product.ai && (
          <Badge
            className="absolute top-2 left-2 border-0 text-white shadow-sm"
            style={{ background: FILL }}
          >
            <AiIcon />
            Best match
          </Badge>
        )}
      </div>
      <div className="px-1">
        <p className="truncate font-semibold text-foreground">{product.name}</p>
        <p className="truncate text-sm text-muted-foreground">{product.spec}</p>
        {product.reason && (
          <p
            className="mt-2 text-sm font-medium"
            style={{
              backgroundImage: TEXT_GRADIENT,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {product.reason}
          </p>
        )}
      </div>
      <div className="mt-auto flex items-baseline gap-2 px-1">
        <span className="text-xl font-bold text-foreground">
          {product.price}
        </span>
        <span className="text-sm text-muted-foreground line-through">
          {product.was}
        </span>
      </div>
      <Button variant={product.ai ? "default" : "secondary"} className="w-full">
        <Plus className="size-4" aria-hidden="true" />
        {product.cta}
      </Button>
    </Card>
  );
}

/** A product grid where the AI pick is set apart by the glow + badge combination. */
export function ProductGrid() {
  return (
    <>
      <div className="grid max-w-4xl gap-6 sm:grid-cols-3">
        {PRODUCTS.map((product) =>
          product.ai ? (
            <div key={product.name} className="relative">
              {/* The AI pick's glow: a soft oblong blob behind the glass card. */}
              <AiGlow />
              <div className="relative h-full">
                <ProductCard product={product} />
              </div>
            </div>
          ) : (
            <ProductCard key={product.name} product={product} />
          ),
        )}
      </div>
      <AiCaveat />
    </>
  );
}
