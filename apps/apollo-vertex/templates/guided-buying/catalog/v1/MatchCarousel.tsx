"use client";

import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/registry/carousel/carousel";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-context";
import {
  activePrice,
  CATALOG_ITEMS,
  defaultQuantityFor,
  eppSavings,
  formatPrice,
  showsListStrike,
} from "./data";
import { ProductImage } from "./ProductImage";
import type { CatalogItem } from "./types";
import { useConversation } from "./conversation-context";

// The agent's signature gradient — reused (not new) so the in-chat pick reads as
// the same recommendation as the catalog's Picked-for-you lead row.
const AI_GRADIENT = { background: "var(--ai-gradient-strong)" };
const ACCENT = "bg-[#0f7b8a] text-white hover:bg-[#0c6976]";
// Request applied EPP, so cards price per unit under EPP.
const BASIS = "epp" as const;
// Soft ease-out for the reveal/morph beats.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface MatchesOutput {
  leadId: string;
  altIds: string[];
  totalCount: number;
  /** While true, the carousel shows skeleton placeholders. */
  loading?: boolean;
}

interface MatchCardProps {
  item: CatalogItem;
  lead?: boolean;
  /** Stagger index for the reveal (pick = 0, first). */
  index: number;
}

/**
 * One result card. Every card shares the template — image → title → spec →
 * rationale slot → price → CTA — so prices and buttons align across the row.
 * The pick fills the rationale and carries the badge + elevation; alternatives
 * reserve the rationale slot empty and stay quiet.
 */
function MatchCard({ item, lead = false, index }: MatchCardProps) {
  const reduceMotion = useReducedMotion();
  const { inCart, setQuantity, quantities } = useCart();
  const { confirmAddToCart } = useConversation();

  const added = inCart(item.id);
  const requestQty = defaultQuantityFor(item);
  const qty = added ? (quantities[item.id] ?? requestQty) : requestQty;
  const showStrike = showsListStrike(item, BASIS);
  const savings = eppSavings(item);

  const onAdd = () => {
    if (added) {
      setQuantity(item, 0);
      return;
    }
    setQuantity(item, requestQty);
    confirmAddToCart(item, requestQty);
  };

  const card = (
    <div
      className={cn(
        "flex h-full flex-col gap-2 bg-card p-3",
        lead ? "rounded-[14px] shadow-md" : "rounded-2xl border shadow-sm",
      )}
    >
      {/* Image — the badge overlays here so the text rows below stay aligned. */}
      <div className="relative">
        <ProductImage
          src={item.image}
          alt={item.name}
          category={item.category}
          vendor={item.vendor}
          className="h-28 rounded-xl"
        />
        {lead && (
          <span
            className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold text-white shadow-sm"
            style={AI_GRADIENT}
          >
            <AutopilotIcon size={12} aria-hidden />
            Picked for you
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        <h3 className="truncate font-semibold leading-snug text-foreground">
          {item.name}
        </h3>
        <p className="truncate text-xs text-muted-foreground">
          {item.specs.join(" · ")}
        </p>
      </div>

      {/* Rationale slot — filled on the pick, reserved (empty) on alternatives. */}
      <p className="min-h-[2.25rem] text-xs font-medium leading-snug text-[#0f7b8a]">
        {lead && savings > 0
          ? `Matches your request · ${formatPrice(savings, item.currency)}/unit cheaper with EPP applied`
          : ""}
      </p>

      <div className="mt-auto space-y-2 pt-1">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-foreground">
            {formatPrice(activePrice(item, BASIS), item.currency)}
          </span>
          {showStrike && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(item.listPrice, item.currency)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={added ? "outline" : lead ? "default" : "secondary"}
          onClick={onAdd}
          aria-pressed={added}
          className={cn("w-full", !added && lead && ACCENT)}
        >
          <motion.span
            key={added ? "added" : "add"}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="flex items-center gap-1.5"
          >
            {added ? (
              <>
                <Check className="size-4" />
                {qty} added
              </>
            ) : (
              <>
                <Plus className="size-4" />
                {lead ? `Add ${qty} to cart` : `Add ${qty}`}
              </>
            )}
          </motion.span>
        </Button>
      </div>
    </div>
  );

  // Reveal: staggered fade-up, pick first. The gradient border wraps the pick.
  return (
    <motion.div
      className="h-full"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE, delay: index * 0.09 }}
    >
      {lead ? (
        <div className="h-full rounded-2xl p-0.5 shadow-md" style={AI_GRADIENT}>
          {card}
        </div>
      ) : (
        card
      )}
    </motion.div>
  );
}

/** Pulsing placeholder shown while the matches "load". */
function MatchCardSkeleton() {
  return (
    <div className="flex h-full animate-pulse flex-col gap-2 rounded-2xl border bg-card p-3">
      <div className="h-28 rounded-xl bg-muted" />
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="min-h-[2.25rem]" />
      <div className="mt-auto h-8 w-full rounded bg-muted" />
    </div>
  );
}

const SKELETON_KEYS = ["s1", "s2", "s3"];

/** The matches carousel Autopilot presents inline in the chat after the confirm. */
export function MatchCarousel({ output }: { output: MatchesOutput }) {
  const navigate = useNavigate();
  const lead = CATALOG_ITEMS.find((item) => item.id === output.leadId);
  const alts = output.altIds
    .map((id) => CATALOG_ITEMS.find((item) => item.id === id))
    .filter((item): item is CatalogItem => item != null);

  if (!lead) return null;

  return (
    <div className="w-full">
      <Carousel opts={{ align: "start" }} className="w-full">
        {/* basis < container so ~2.5 cards peek and it reads as swipeable. */}
        <CarouselContent>
          {output.loading ? (
            SKELETON_KEYS.map((key) => (
              <CarouselItem key={key} className="basis-[240px]">
                <MatchCardSkeleton />
              </CarouselItem>
            ))
          ) : (
            <>
              <CarouselItem className="basis-[240px]">
                <MatchCard item={lead} lead index={0} />
              </CarouselItem>
              {alts.map((item, i) => (
                <CarouselItem key={item.id} className="basis-[240px]">
                  <MatchCard item={item} index={i + 1} />
                </CarouselItem>
              ))}
            </>
          )}
        </CarouselContent>

        {/* Controls live below the row — never overlapping card content. */}
        {!output.loading && (
          <div className="mt-3 flex items-center gap-2">
            <CarouselPrevious className="static size-7 translate-y-0" />
            <CarouselNext className="static size-7 translate-y-0" />
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => void navigate({ to: "/catalog" })}
            >
              See all {output.totalCount} in catalog
            </Button>
          </div>
        )}
      </Carousel>
    </div>
  );
}

/** "Review & submit" affordance shown after an in-chat add-to-cart. */
export function ReviewCta() {
  const navigate = useNavigate();
  return (
    <Button size="sm" onClick={() => void navigate({ to: "/review" })}>
      Review &amp; submit
    </Button>
  );
}
