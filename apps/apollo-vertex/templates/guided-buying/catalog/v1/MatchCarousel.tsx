"use client";

import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Info,
  MessageCircle,
  Plus,
  Store,
  X,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { P1 } from "../../P1";
import { P2 } from "../../P2";
import { useAssistantThread } from "./assistant-thread-context";
import { useCart } from "./cart-context";
import { useConversation } from "./conversation-context";
import {
  activePrice,
  CATALOG_ITEMS,
  defaultQuantityFor,
  formatPrice,
  ramGb,
  showsListStrike,
} from "./data";
import { useFlowFooter } from "./FlowFooter";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";
import { Selection } from "./Selection";
import type { CatalogItem } from "./types";

// Request applied EPP, so cards price per unit under EPP.
const BASIS = "epp" as const;
// Soft ease-out for the reveal/morph beats.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Lenovo ThinkPad X1 Yoga — set aside at P2 because it violates the saved 32GB rule.
const YOGA_ID = "lnv-x1-yoga-g9";

// Deck j1-04: why each non-pick card wasn't chosen. Shown as italic rationale.
const NOT_PICKED_REASONS: Record<string, string> = {
  [YOGA_ID]: "Touch adds cost, 16GB",
  "dell-xps-14": "$50 less, smaller discount",
};

export interface MatchesOutput {
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
  /** Deck j1-04: italic "Not picked · reason" for non-lead cards. */
  notPickedReason?: string;
  /**
   * Deck j1-05: renders the card in "set aside" state — dashed border, desaturated
   * image, AI chip explaining why. CTA becomes "Show anyway". Only used for the
   * Yoga card at P2 after the dock correction in stop 3.
   */
  setAside?: boolean;
  onShowAnyway?: () => void;
  /** Opens the shelf dock scoped to this card's item. */
  onWhyNotThisClick?: () => void;
  onOpenDetail?: () => void;
}

/**
 * One result row. Every row shares the template — image, title + spec +
 * rationale slot, then price + CTA — stacked in a list rather than a grid, so
 * each row's height is its own; nothing needs to align across siblings.
 * The pick fills the rationale with evidence chips; alternatives show the italic
 * "Not picked · reason" line; set-aside shows an AI chip and "Show anyway".
 */
function MatchCard({
  item,
  lead = false,
  index,
  notPickedReason,
  setAside = false,
  onShowAnyway,
  onWhyNotThisClick,
  onOpenDetail,
}: MatchCardProps) {
  const reduceMotion = useReducedMotion();
  const { inCart, setQuantity, quantities } = useCart();

  const added = inCart(item.id);
  const requestQty = defaultQuantityFor(item);
  const qty = added ? (quantities[item.id] ?? requestQty) : requestQty;
  const showStrike = showsListStrike(item, BASIS);

  // Adding keeps the matches visible — the cart count is what grows. Quantity is
  // then adjustable here (stepper) or in the cart peek; removal lives in the peek.
  const onAdd = () => setQuantity(item, requestQty);

  // Content shared by both glass row (normal/lead) and plain div (set-aside).
  const rowContent = (
    <>
      {/* Placeholder for now — subtle tint + category icon, no photo. */}
      <ProductImage
        alt={item.name}
        category={item.category}
        vendor={item.vendor}
        className={cn(
          "size-16 shrink-0 rounded-lg bg-muted",
          setAside && "grayscale opacity-60",
        )}
        iconClassName="size-6 text-muted-foreground/50"
      />

      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            "font-semibold leading-snug",
            setAside ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {item.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {item.specs.join(" · ")}
        </p>

        {/* Rationale slot — a consistent minimum height regardless of
            content, so rows with nothing to show (e.g. a browsed-in item
            with no "why not" reasoning) don't read shorter than the rest. */}
        <div className="mt-2 min-h-[18px]">
          {lead ? (
            // Evidence for the pick: roman (not italic), one step up in
            // contrast from the alternatives' caveat line, one small icon
            // per item. "Ordered in May" gets its own icon (memory-derived)
            // rather than a colour tint — meaning shouldn't ride on colour
            // alone.
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Check className="size-3" aria-hidden />
                Best price after EPP
              </span>
              <P1>
                <span className="inline-flex items-center gap-1">
                  <Check className="size-3" aria-hidden />
                  Meets full spec
                </span>
              </P1>
              <P2>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" aria-hidden />
                  Ordered in May
                </span>
              </P2>
            </div>
          ) : setAside ? (
            <Badge
              status="ai"
              variant="secondary"
              className="gap-1 text-[11px]"
            >
              <Bookmark className="size-3" aria-hidden />
              Set aside · below your 32GB min
            </Badge>
          ) : notPickedReason ? (
            <p className="text-xs italic leading-snug text-muted-foreground/70">
              {notPickedReason}
              {onWhyNotThisClick && (
                <>
                  {" · "}
                  <button
                    type="button"
                    className="not-italic underline hover:text-foreground"
                    onClick={onWhyNotThisClick}
                  >
                    Why not this?
                  </button>
                </>
              )}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-lg font-semibold",
              setAside ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {formatPrice(activePrice(item, BASIS), item.currency)}
          </span>
          {showStrike && !setAside && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(item.listPrice, item.currency)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onOpenDetail && (
            <Button variant="ghost" size="sm" onClick={onOpenDetail}>
              Details
            </Button>
          )}
          {setAside ? (
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground"
              onClick={onShowAnyway}
            >
              Show anyway
            </Button>
          ) : added ? (
            <QuantityStepper
              value={qty}
              onChange={(next) => setQuantity(item, next)}
              min={0}
            />
          ) : (
            <Button
              size="sm"
              variant={lead ? "default" : "secondary"}
              onClick={onAdd}
            >
              <motion.span
                initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18, ease: EASE }}
                className="flex items-center gap-1.5"
              >
                <Plus className="size-4" />
                {`Add ${qty}`}
              </motion.span>
            </Button>
          )}
        </div>
      </div>
    </>
  );

  // Reveal: staggered fade-up, pick first.
  // motion wrapper is relative so AiGlow (absolute -inset) positions correctly.
  return (
    <motion.div
      className="relative"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE, delay: index * 0.09 }}
    >
      {/* AiGlow sits behind the glass row; only the AI pick gets one. */}
      {lead && <AiGlow variant="card" />}
      {setAside ? (
        <div className="relative flex items-center gap-4 rounded-lg border-[1.5px] border-dashed border-border/60 bg-background p-4">
          {rowContent}
        </div>
      ) : (
        <Card
          variant="glass"
          className={cn(
            "relative flex-row items-center gap-4 p-4",
            // AI-toolkit guideline: a glass card paired with a glow needs the
            // higher-opacity ai-glass surface, or the glow reads as barely
            // visible behind it (especially in dark mode).
            lead && "bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]",
          )}
        >
          {/* Rides the row's top border, left-aligned — the same treatment
              the card layout used before the switch to rows. */}
          {lead && (
            <Badge
              status="ai"
              variant="default"
              className="absolute -top-[9px] left-4 text-[11px] font-semibold"
            >
              <AiMark size={12} aria-hidden />
              AI pick
            </Badge>
          )}
          {rowContent}
        </Card>
      )}
    </motion.div>
  );
}

/** Pulsing placeholder shown while the matches "load". */
function MatchCardSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-lg border bg-card p-4">
      <div className="size-16 shrink-0 rounded-lg bg-muted" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
      <div className="h-8 w-24 shrink-0 rounded bg-muted" />
    </div>
  );
}

const SKELETON_KEYS = ["s1", "s2", "s3"];

/** The matches carousel Autopilot presents inline in the chat after the confirm. */
export function MatchCarousel({
  output,
  correctionMade = false,
  onWhyNotThisClick,
  onNotFindingClick,
  onYogaShowAnyway,
  onOpenDetail,
}: {
  output: MatchesOutput;
  /** True after the P2 dock correction — Yoga card enters set-aside state. */
  correctionMade?: boolean;
  /** Opens the shelf dock scoped to the given item. */
  onWhyNotThisClick?: (item: CatalogItem) => void;
  /** Opens the shelf dock generically, from the "not finding what you're
   * looking for?" prompt below the match list. */
  onNotFindingClick?: () => void;
  onYogaShowAnyway?: () => void;
  /** Opens the ProductDetail overlay for a given catalog item. */
  onOpenDetail?: (item: CatalogItem) => void;
}) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { stepBack } = useConversation();
  const { addStepEntry } = useAssistantThread();
  const { items: cartItems, quantities, count: cartCount } = useCart();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const lead = CATALOG_ITEMS.find((item) => item.id === output.leadId);
  const alts = output.altIds
    .map((id) => CATALOG_ITEMS.find((item) => item.id === id))
    .filter((item): item is CatalogItem => item != null);

  // The narrowing, derived from the catalog: how many laptops matched, how
  // many cleared the 32GB minimum, and the one picked.
  const laptops = CATALOG_ITEMS.filter((item) => item.category === "Laptops");
  const qualifying = laptops.filter((item) => (ramGb(item) ?? 0) >= 32);

  // Thread entry: live once the pick has resolved, not gated on any click.
  useEffect(() => {
    if (!lead || output.loading) return;
    const summary = `Narrowed ${laptops.length} laptops to ${qualifying.length} that meet your 32GB minimum, picked the ${lead.name}.`;
    const detail = [
      `${laptops.length} laptops in the catalog matched your request.`,
      `${qualifying.length} met the 32GB minimum.`,
      `Picked ${lead.name}: best price after EPP and meets full spec.`,
    ];
    addStepEntry("choose", summary, detail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead, output.loading, laptops.length, qualifying.length]);

  // Same staggered fade-up as Bridge/Intake's shared heading, so the Choose
  // screen's own hero (supplied via hideBrand) animates in the same way.
  const headingGroup = {
    initial: {},
    animate: { transition: { staggerChildren: 0.08, delayChildren: 0.18 } },
  };
  const headingLine = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 10 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.28, ease: EASE },
        },
      };

  // Live cart total (EPP), baked into the primary so it doubles as a glance.
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + activePrice(item, BASIS) * (quantities[item.id] ?? 0),
    0,
  );

  useFlowFooter(
    !lead || output.loading
      ? null
      : {
          left: (
            <Button variant="secondary" size="sm" onClick={stepBack}>
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Button>
          ),
          right: (
            // Always present — disabled with no total until the cart has items.
            <Button
              size="sm"
              onClick={() =>
                // biome-ignore lint/suspicious/noExplicitAny: `from` isn't a
                // registered history-state key (see Selection.tsx's reviewSubmit).
                void navigate({ to: "/review", state: { from: "buy" } as any })
              }
              disabled={cartCount === 0}
            >
              {cartCount > 0
                ? `Review & submit · ${cartCount} item${cartCount === 1 ? "" : "s"} · ${formatPrice(cartTotal, "USD")}`
                : "Review & submit"}
            </Button>
          ),
        },
  );

  if (!lead) return null;

  return (
    <div className="w-full">
      {/* Same centered column measure as Bridge, so the two screens read as
          one family. */}
      <div className="mx-auto mb-8 max-w-prose text-center">
        {/* Same staggered fade-up as Bridge/Intake's shared heading. */}
        <motion.div variants={headingGroup} initial="initial" animate="animate">
          {/* The recommendation is the headline now — same copy at both
              tiers, tier-stable. No eyebrow above it — same placement as
              Bridge's own title, which also starts flush at pt-[7vh]. The
              AI mark lives in the header now, not the headline. */}
          {!output.loading && (
            <>
              <motion.h1
                variants={headingLine}
                className="text-2xl font-semibold text-foreground tracking-tight"
              >
                The{" "}
                <span
                  className="rounded px-1"
                  style={{ backgroundImage: "var(--ai-gradient)" }}
                >
                  X1 Carbon
                </span>{" "}
                is the closest fit to your request
              </motion.h1>
              {/* Subhead: product reasons only, identical at both tiers —
                  the heading block is a pure insertion below, no
                  substitution. */}
              <motion.p
                variants={headingLine}
                className="mt-1.5 text-sm leading-6 text-muted-foreground"
              >
                Best price after EPP, and it clears your 32GB minimum.
              </motion.p>
              {/* Attribution — smallest, muted, provenance only. P2-only
                  insertion, not a substitution — P1 has no attribution
                  line. */}
              <P2>
                <motion.p
                  variants={headingLine}
                  className="mt-1 text-xs text-muted-foreground"
                >
                  From your team&apos;s May order and the Design contractor
                  spec.{" "}
                  <button
                    type="button"
                    className="underline hover:text-foreground"
                  >
                    Update my preferences
                  </button>
                </motion.p>
              </P2>
            </>
          )}
        </motion.div>
      </div>

      {/* Stacked rows at the same width as Bridge's card — no bleed. Extra
          top clearance (pt-4, not py-2) so the lead row's badge, riding its
          top border, has room and isn't crowded by the heading block above. */}
      <div className="w-full">
        <div className="space-y-3 pt-4 pb-2">
          {output.loading ? (
            SKELETON_KEYS.map((key) => <MatchCardSkeleton key={key} />)
          ) : (
            <>
              <MatchCard
                item={lead}
                lead
                index={0}
                onOpenDetail={
                  onOpenDetail ? () => onOpenDetail(lead) : undefined
                }
              />
              {alts.map((item, i) => {
                if (item.id === YOGA_ID) {
                  return (
                    <Fragment key={item.id}>
                      {/* P1: always normal card — no set-aside */}
                      <P1>
                        <MatchCard
                          item={item}
                          index={i + 1}
                          notPickedReason={NOT_PICKED_REASONS[item.id]}
                          onWhyNotThisClick={
                            onWhyNotThisClick
                              ? () => onWhyNotThisClick(item)
                              : undefined
                          }
                          onOpenDetail={
                            onOpenDetail ? () => onOpenDetail(item) : undefined
                          }
                        />
                      </P1>
                      {/* P2: set-aside after dock correction, normal before */}
                      <P2>
                        <MatchCard
                          item={item}
                          index={i + 1}
                          notPickedReason={
                            correctionMade
                              ? undefined
                              : NOT_PICKED_REASONS[item.id]
                          }
                          setAside={correctionMade}
                          onShowAnyway={onYogaShowAnyway}
                          onWhyNotThisClick={
                            !correctionMade && onWhyNotThisClick
                              ? () => onWhyNotThisClick(item)
                              : undefined
                          }
                          onOpenDetail={
                            onOpenDetail ? () => onOpenDetail(item) : undefined
                          }
                        />
                      </P2>
                    </Fragment>
                  );
                }
                return (
                  <MatchCard
                    key={item.id}
                    item={item}
                    index={i + 1}
                    notPickedReason={NOT_PICKED_REASONS[item.id]}
                    onWhyNotThisClick={
                      onWhyNotThisClick
                        ? () => onWhyNotThisClick(item)
                        : undefined
                    }
                    onOpenDetail={
                      onOpenDetail ? () => onOpenDetail(item) : undefined
                    }
                  />
                );
              })}

              {/* AI escalation — offered directly instead of paging through
                  the rest of the catalog. */}
              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 px-4 py-4">
                <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <AiMark size={16} gradientId="gb-ai-mark" aria-hidden />
                  Not finding what you&apos;re looking for?
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNotFindingClick}
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    Ask AI
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCatalogOpen(true)}
                  >
                    <Store className="size-4" aria-hidden />
                    Pull up Catalog
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="flex items-center gap-1.5 px-1 pt-3 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden />
        The output is AI generated. Please review.
      </p>

      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent
          fullscreen
          showCloseButton={false}
          className="top-8 right-8 bottom-0 left-8 rounded-t-xl border border-b-0 p-0 shadow-2xl"
        >
          <DialogTitle className="sr-only">Catalog</DialogTitle>
          {/* Floats outside Selection's own content — top-4/right-4 sat right
              on top of its Cart button, since Selection owns that corner too. */}
          <DialogClose className="absolute -top-3 -right-3 z-50 flex size-9 items-center justify-center rounded-full border bg-background shadow-lg outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-4" aria-hidden />
            <span className="sr-only">Close</span>
          </DialogClose>
          <div className="h-full overflow-hidden rounded-t-xl">
            <Selection cold />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** "Review & submit" affordance shown after an in-chat add-to-cart — registers
 * into the shared FlowFooter (Back + primary), renders nothing itself. */
export function ReviewCta() {
  const navigate = useNavigate();
  const { stepBack } = useConversation();
  useFlowFooter({
    left: (
      <Button variant="secondary" size="sm" onClick={stepBack}>
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </Button>
    ),
    right: (
      <Button
        size="sm"
        onClick={() =>
          // biome-ignore lint/suspicious/noExplicitAny: `from` isn't a
          // registered history-state key (see Selection.tsx's reviewSubmit).
          void navigate({ to: "/review", state: { from: "buy" } as any })
        }
      >
        Review &amp; submit
      </Button>
    ),
  });
  return null;
}

/** "View in Workbench" affordance after an off-catalog handoff (buyer's seat). */
export function WorkbenchCta() {
  const navigate = useNavigate();
  const { stepBack } = useConversation();
  return (
    <div className="flex items-center justify-between gap-3">
      {/* Back lives here now, not the header. */}
      <Button variant="secondary" size="sm" onClick={stepBack}>
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void navigate({ to: "/workbench" })}
      >
        View in Workbench
        <ArrowRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
