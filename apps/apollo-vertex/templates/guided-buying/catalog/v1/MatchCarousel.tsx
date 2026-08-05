"use client";

import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
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
// Smoother, more balanced curve for the card exit/enter specifically — EASE
// above front-loads almost all of its motion in the first ~20% of the
// duration then coasts, which reads as a "jump then drift" on something as
// large as a whole card. This one accelerates and decelerates evenly.
const CARD_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

// Lenovo ThinkPad X1 Yoga — set aside at P2 because it violates the saved 32GB rule.
const YOGA_ID = "lnv-x1-yoga-g9";

// Deck j1-04: why each non-pick card wasn't chosen. Shown as italic rationale.
const NOT_PICKED_REASONS: Record<string, string> = {
  [YOGA_ID]: "Touch adds cost, 16GB",
  "dell-xps-14": "$50 less, smaller discount",
};

// Deck j1-08: the signals behind "Update my preferences" — same three that
// back the lead card's rationale chips and the attribution line below the
// headline, not a separate preference model.
type SignalId = "epp" | "minRam" | "mayOrder";

const DEFAULT_SIGNAL_STATE: Record<SignalId, boolean> = {
  epp: true,
  minRam: true,
  mayOrder: true,
};

const SIGNAL_NAMES: Record<SignalId, string> = {
  epp: "Best price after EPP",
  minRam: "RAM minimum",
  mayOrder: "Your team's May order",
};

const DEFAULT_RAM_MIN_GB = "32";

// Deck j1-09: re-rank scoring + copy generation — one model shared by the
// ordering, the headline/subhead/attribution, and each row's rationale, so
// "why this order" is never invented separately in more than one place.

/** "Lenovo ThinkPad X1 Carbon" → "X1 Carbon" — the headline's short form. */
function shortItemName(item: CatalogItem): string {
  return item.name.replace(/^Lenovo ThinkPad /, "").replace(/^Dell /, "");
}

function capitalize(text: string): string {
  return text.length > 0 ? text[0].toUpperCase() + text.slice(1) : text;
}

function joinParts(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

/** Lower is better. Price always contributes something, even with the price
 * signal off, so an all-off comparison still resolves to a deterministic
 * order instead of a tie. */
function scoreCandidate(
  item: CatalogItem,
  signals: Record<SignalId, boolean>,
  ramMinThreshold: number,
  ramMinEnforced: boolean,
): number {
  let score = signals.epp
    ? activePrice(item, BASIS) / 1000
    : activePrice(item, BASIS) / 1_000_000;
  if (signals.mayOrder && item.vendor === "Lenovo") score -= 5;
  if (
    signals.minRam &&
    ramMinEnforced &&
    (ramGb(item) ?? 0) < ramMinThreshold
  ) {
    score += 100;
  }
  return score;
}

/** Reasons this item is winning, in the same vocabulary as the lead card's
 * evidence chips — only ever citing a signal that's still on. */
function winningReasonParts(
  item: CatalogItem,
  signals: Record<SignalId, boolean>,
  ramMinThreshold: number,
): string[] {
  const parts: string[] = [];
  if (signals.epp) parts.push("has the best price after EPP");
  if (signals.minRam && (ramGb(item) ?? 0) >= ramMinThreshold) {
    parts.push(`clears your ${ramMinThreshold}GB minimum`);
  }
  if (signals.mayOrder && item.vendor === "Lenovo") {
    parts.push("matches your team's recent ThinkPad orders");
  }
  return parts;
}

/** Short keyword form of winningReasonParts, for the one-line agent note. */
function reasonKeywords(
  item: CatalogItem,
  signals: Record<SignalId, boolean>,
  ramMinThreshold: number,
): string {
  const words: string[] = [];
  if (signals.epp) words.push("price");
  if (signals.minRam && (ramGb(item) ?? 0) >= ramMinThreshold) {
    words.push("spec");
  }
  if (signals.mayOrder && item.vendor === "Lenovo")
    words.push("brand continuity");
  return words.length > 0
    ? words.join(" and ")
    : "what's left of your preferences";
}

function buildSubhead(
  item: CatalogItem,
  signals: Record<SignalId, boolean>,
  ramMinThreshold: number,
): string {
  const parts = winningReasonParts(item, signals, ramMinThreshold);
  if (parts.length === 0) {
    return "The closest match among what's left of your preferences.";
  }
  return `It ${joinParts(parts)}.`;
}

/** Only ever cites a source whose signal is still on — never a signal the
 * user just turned off. */
function buildAttribution(signals: Record<SignalId, boolean>): string {
  const sources: string[] = [];
  if (signals.mayOrder) sources.push("your team's May order");
  if (signals.minRam) sources.push("the Design contractor spec");
  if (sources.length === 0) return "Ranked on price alone.";
  return `From ${joinParts(sources)}.`;
}

/** Why this alternative lost to the current lead, given the active signals —
 * regenerated per re-rank instead of a fixed lookup, so it always reflects
 * the current basis for ranking. Built from every active signal that counts
 * against this item, not just the first one found — a price gap is never
 * cited once the EPP signal is off, a brand gap never once mayOrder is off. */
function dynamicNotPickedReason(
  item: CatalogItem,
  leadItem: CatalogItem,
  signals: Record<SignalId, boolean>,
  ramMinThreshold: number,
  ramMinEnforced: boolean,
): string {
  const itemRam = ramGb(item) ?? 0;
  if (signals.minRam && ramMinEnforced && itemRam < ramMinThreshold) {
    return `${itemRam}GB, below your ${ramMinThreshold}GB minimum`;
  }
  const parts: string[] = [];
  if (signals.epp) {
    const diff = Math.round(
      activePrice(item, BASIS) - activePrice(leadItem, BASIS),
    );
    if (diff > 0) parts.push(`$${diff} more after EPP`);
    else if (diff < 0) parts.push(`$${Math.abs(diff)} less`);
  }
  if (
    signals.mayOrder &&
    leadItem.vendor === "Lenovo" &&
    item.vendor !== "Lenovo"
  ) {
    parts.push("a different brand than your team's usual");
  }
  return parts.length > 0 ? joinParts(parts) : "Comparable option";
}

interface LeadRationale {
  epp: boolean;
  spec: boolean;
  brand: boolean;
  ramMinThreshold: number;
}

function leadRationaleFlags(
  item: CatalogItem,
  signals: Record<SignalId, boolean>,
  ramMinThreshold: number,
): LeadRationale {
  return {
    epp: signals.epp,
    spec: signals.minRam && (ramGb(item) ?? 0) >= ramMinThreshold,
    brand: signals.mayOrder && item.vendor === "Lenovo",
    ramMinThreshold,
  };
}

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
  /** Deck j1-09: once a re-rank has happened, replaces the lead row's
   * tier-gated default chips with the signals that actually still apply. */
  leadRationale?: LeadRationale;
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
  leadRationale,
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
            with no "why not" reasoning) don't read shorter than the rest.
            No internal crossfade needed here anymore — a re-rank fully
            exits the old set of cards and enters a fresh one (see the
            carousel below), so each card mounts once with its final,
            correct content rather than updating in place. */}
        <div className="mt-2 min-h-[18px]">
          {lead ? (
            // Evidence for the pick: roman (not italic), one step up in
            // contrast from the alternatives' caveat line, one small icon
            // per item. "Ordered in May" gets its own icon (memory-derived)
            // rather than a colour tint — meaning shouldn't ride on colour
            // alone.
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {leadRationale ? (
                // Deck j1-09: post-re-rank — only cite a signal that's still on.
                <>
                  {leadRationale.epp && (
                    <span className="inline-flex items-center gap-1">
                      <Check className="size-3" aria-hidden />
                      Best price after EPP
                    </span>
                  )}
                  {leadRationale.spec && (
                    <span className="inline-flex items-center gap-1">
                      <Check className="size-3" aria-hidden />
                      Meets {leadRationale.ramMinThreshold}GB minimum
                    </span>
                  )}
                  {leadRationale.brand && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" aria-hidden />
                      Ordered in May
                    </span>
                  )}
                  {!leadRationale.epp &&
                    !leadRationale.spec &&
                    !leadRationale.brand && (
                      <span className="italic">Best remaining match</span>
                    )}
                </>
              ) : (
                <>
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
                </>
              )}
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

  // Deck j1-11: a re-rank fully exits the old set of cards and enters the
  // new one — no physical FLIP/repositioning. Leaving cards fade + drop
  // (down), staggered by their old position; entering cards fade + rise
  // (up), staggered by their new position — same direction vocabulary as the
  // headline/subhead above, so the whole screen reads as one consistent
  // "out-and-down, in-and-up" idiom. Because each card is a fresh mount each
  // time (see the carousel's key below), `lead`/badge/glow are just part of
  // its normal content — no separate cross-card animation needed, which is
  // also what removes the old thumbnail/z-index/flex-gap glitches entirely.
  const CARD_STAGGER = 0.07;
  return (
    <motion.div
      className="relative"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      transition={{
        duration: reduceMotion ? 0 : 0.34,
        ease: CARD_EASE,
        delay: reduceMotion ? 0 : index * CARD_STAGGER,
        exit: {
          duration: reduceMotion ? 0 : 0.3,
          ease: CARD_EASE,
          delay: reduceMotion ? 0 : index * CARD_STAGGER,
        },
      }}
    >
      {/* AiGlow sits behind the glass row; only the AI pick gets one. It
          gets its own small opacity animation (rather than relying purely on
          the parent card fading in around it) so the browser promotes it to
          its own compositor layer up front — a blurred element that only
          ever inherits opacity from an ancestor's fade tends to get
          re-rasterized as that ancestor's opacity changes, which is what was
          reading as a "blink" the moment a new lead card mounted. */}
      {lead && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.34, ease: CARD_EASE }}
          style={{ willChange: "opacity" }}
        >
          <AiGlow variant="card" />
        </motion.div>
      )}
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
              the card layout used before the switch to rows. Already
              `absolute` on Badge itself, so — unlike a wrapping animation
              element would — it never counts as an extra flex item in
              Card's `flex-row gap-4` and never indents the thumbnail. */}
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

interface PreferencesPanelProps {
  draftSignals: Record<SignalId, boolean>;
  onSignalChange: (id: SignalId, on: boolean) => void;
  ramMinDraft: string;
  onRamMinDraftChange: (value: string) => void;
  editingRamRule: boolean;
  onEditingRamRuleChange: (editing: boolean) => void;
  persistence: "session" | "remember";
  onPersistenceChange: (value: "session" | "remember") => void;
  onCancel: () => void;
  onApply: () => void;
}

/**
 * Deck j1-08: "What shaped this recommendation" — scoped to this one pick,
 * not a global preferences surface. Every row is derived from the same three
 * signals the lead card's rationale chips and the attribution line above
 * already name (EPP price, the RAM minimum, the team's May order), so this
 * never invents a preference the rest of the screen doesn't already show.
 */
function PreferencesPanel({
  draftSignals,
  onSignalChange,
  ramMinDraft,
  onRamMinDraftChange,
  editingRamRule,
  onEditingRamRuleChange,
  persistence,
  onPersistenceChange,
  onCancel,
  onApply,
}: PreferencesPanelProps) {
  const rows: {
    id: SignalId;
    name: string;
    description: string;
    editable?: boolean;
  }[] = [
    {
      id: "epp",
      name: "Best price after EPP",
      description: "Ranks options by your employee price, not list price.",
    },
    {
      id: "minRam",
      name: `${ramMinDraft || DEFAULT_RAM_MIN_GB}GB minimum`,
      description: `Excludes laptops under ${ramMinDraft || DEFAULT_RAM_MIN_GB}GB RAM. Saved to the Design Contractor spec.`,
      editable: true,
    },
    {
      id: "mayOrder",
      name: "Your team's May order",
      description:
        "Weights toward the same brand your team ordered last, for matching drivers and setup.",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          What shaped this recommendation
        </h3>
        <p className="text-xs text-muted-foreground">
          Turning any of these off re-ranks the options.
        </p>
      </div>

      <div className="space-y-3.5">
        {rows.map((row) => {
          const on = draftSignals[row.id];
          return (
            <div key={row.id} className={cn("space-y-1", !on && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <Label
                  htmlFor={`signal-${row.id}`}
                  className="text-sm font-medium text-foreground"
                >
                  {row.name}
                  {!on && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      Off
                    </span>
                  )}
                </Label>
                <Switch
                  id={`signal-${row.id}`}
                  checked={on}
                  onCheckedChange={(checked) => onSignalChange(row.id, checked)}
                />
              </div>
              <p className="text-xs text-muted-foreground">{row.description}</p>
              {row.editable &&
                (editingRamRule ? (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Input
                      value={ramMinDraft}
                      onChange={(e) =>
                        onRamMinDraftChange(
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      inputMode="numeric"
                      className="h-7 w-16 text-xs"
                      autoFocus
                    />
                    <span className="text-xs text-muted-foreground">GB</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        if (!ramMinDraft.trim()) {
                          onRamMinDraftChange(DEFAULT_RAM_MIN_GB);
                        }
                        onEditingRamRuleChange(false);
                      }}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-primary underline hover:text-primary/80"
                    onClick={() => onEditingRamRuleChange(true)}
                  >
                    Edit this rule
                  </button>
                ))}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-medium text-foreground">Apply this to</p>
        <RadioGroup
          value={persistence}
          onValueChange={(value) =>
            onPersistenceChange(value as "session" | "remember")
          }
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="session" id="prefs-persist-session" />
            <Label
              htmlFor="prefs-persist-session"
              className="text-xs font-normal text-foreground"
            >
              Just this request
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="remember" id="prefs-persist-remember" />
            <Label
              htmlFor="prefs-persist-remember"
              className="text-xs font-normal text-foreground"
            >
              Remember for next time
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={onApply}>
          Re-rank options
        </Button>
      </div>
    </div>
  );
}

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
  const { addStepEntry, addNoteEntry } = useAssistantThread();
  const { items: cartItems, quantities, count: cartCount } = useCart();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const lead = CATALOG_ITEMS.find((item) => item.id === output.leadId);
  const alts = output.altIds
    .map((id) => CATALOG_ITEMS.find((item) => item.id === id))
    .filter((item): item is CatalogItem => item != null);

  // Deck j1-08/09: "Update my preferences" popover state — the signals behind
  // the pick, applied vs. in-progress-edit, plus the editable 32GB rule.
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [draftSignals, setDraftSignals] = useState(DEFAULT_SIGNAL_STATE);
  const [persistence, setPersistence] = useState<"session" | "remember">(
    "session",
  );
  const [ramMinDraft, setRamMinDraft] = useState(DEFAULT_RAM_MIN_GB);
  const [editingRamRule, setEditingRamRule] = useState(false);

  // Deck j1-11: the re-rank sequence is four beats, each waiting for the
  // last to visually settle before it starts (point 4's ordering, extended):
  // (1) the headline/subhead/attribution swap — old fades out + up, new
  // fades in + up; (2) the current cards fade out + down, staggered; (3)
  // after a slight gap, the new cards fade in + up, staggered; (4) the
  // agent note banner arrives last, its own height growing in to visibly
  // push the cards down rather than overlaying them. `narrativeSignals`
  // drives the text (updates first); `cardSignals` drives the actual
  // rendered list (updates second, once the text has settled) — keeping
  // these separate is what lets the headline change before the cards do.
  const [hasReranked, setHasReranked] = useState(false);
  const [narrativeSignals, setNarrativeSignals] =
    useState(DEFAULT_SIGNAL_STATE);
  const [narrativeRamMinApplied, setNarrativeRamMinApplied] =
    useState(DEFAULT_RAM_MIN_GB);
  const [cardSignals, setCardSignals] = useState(DEFAULT_SIGNAL_STATE);
  const [cardRamMinApplied, setCardRamMinApplied] =
    useState(DEFAULT_RAM_MIN_GB);
  // True for the brief gap between "old cards fully exited" and "new cards
  // mounted" — nothing renders in the list during this window.
  const [cardsHidden, setCardsHidden] = useState(false);
  // Bumped on every applied re-rank so each card's key changes even when its
  // `item.id` doesn't — forcing a full exit+enter instead of an in-place
  // update, which is what replaced the old FLIP-based repositioning.
  const [cardGen, setCardGen] = useState(0);
  const [agentNote, setAgentNote] = useState<string | null>(null);
  const narrativeRamMinThreshold =
    Number(narrativeRamMinApplied) || Number(DEFAULT_RAM_MIN_GB);
  const cardRamMinThreshold =
    Number(cardRamMinApplied) || Number(DEFAULT_RAM_MIN_GB);

  // The card list fully empties for a beat between the old set exiting and
  // the new set entering (see `cardsHidden` above) — without a floor, the
  // container collapses to zero height right then, so everything below (the
  // escalation strip, the caveat, the footer) jumps up for that gap and gets
  // shoved back down the instant the new cards land. Track the tallest
  // height the list has actually shown and hold the container to at least
  // that during the gap, so there's nothing to collapse into in the first
  // place — simpler and more reliable than trying to animate the collapse.
  const cardListRef = useRef<HTMLDivElement>(null);
  const [minListHeight, setMinListHeight] = useState<number | undefined>(
    undefined,
  );
  useLayoutEffect(() => {
    if (cardsHidden || output.loading) return;
    const el = cardListRef.current;
    if (!el) return;
    const height = el.getBoundingClientRect().height;
    setMinListHeight((prev) => (prev == null || height > prev ? height : prev));
  }, [cardsHidden, output.loading, cardSignals, cardRamMinApplied, cardGen]);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      for (const t of timersRef.current) clearTimeout(t);
    },
    [],
  );
  const after = (fn: () => void, delayMs: number) => {
    timersRef.current.push(setTimeout(fn, delayMs));
  };
  const clearPendingTimers = () => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  };

  const openPrefs = (open: boolean) => {
    setPrefsOpen(open);
    if (open) {
      // Re-seed the draft from what's actually applied every time it opens —
      // a cancelled edit shouldn't linger into the next open.
      setDraftSignals(cardSignals);
      setRamMinDraft(cardRamMinApplied);
      setEditingRamRule(false);
      setPersistence("session");
    }
  };

  const candidatePool = lead ? [lead, ...alts] : alts;
  const rankBy = (
    signals: Record<SignalId, boolean>,
    ramMinThresholdArg: number,
  ) =>
    [...candidatePool].sort(
      (a, b) =>
        scoreCandidate(
          a,
          signals,
          ramMinThresholdArg,
          Boolean(correctionMade),
        ) -
        scoreCandidate(b, signals, ramMinThresholdArg, Boolean(correctionMade)),
    );

  const narrativeRanked = rankBy(narrativeSignals, narrativeRamMinThreshold);
  const narrativeLead = narrativeRanked[0] ?? lead;
  const cardRanked = rankBy(cardSignals, cardRamMinThreshold);
  const cardLead = cardRanked[0] ?? lead;

  // Timing for the four beats above. Reduced motion collapses every delay to
  // 0 — the sequence still runs (so the agent note still appears, point 9),
  // it just happens effectively at once with no visible movement or stagger.
  const POPOVER_CLOSE_MS = 100; // lets the popover's own close read as its own beat
  const HEADLINE_SETTLE_MS = 420; // old exit + new enter, mode="wait"
  const CARD_EXIT_SETTLE_MS = 460; // staggered exit of the outgoing cards
  const CARD_GAP_MS = 120; // the "slight delay" before the new set enters
  const CARD_ENTER_SETTLE_MS = 500; // staggered enter of the incoming cards

  const applyPrefs = () => {
    const signalChanges = (Object.keys(draftSignals) as SignalId[]).filter(
      (id) => draftSignals[id] !== cardSignals[id],
    );
    const ramChanged =
      ramMinDraft.trim() !== "" && ramMinDraft !== cardRamMinApplied;
    const nothingChanged = signalChanges.length === 0 && !ramChanged;

    if (persistence === "remember" && !nothingChanged) {
      const parts = signalChanges.map((id) =>
        draftSignals[id]
          ? `turned "${SIGNAL_NAMES[id]}" back on`
          : `turned off "${SIGNAL_NAMES[id]}"`,
      );
      if (ramChanged) parts.push(`set the minimum to ${ramMinDraft}GB`);
      addNoteEntry(`Remembered for next time: ${parts.join(", ")}.`);
    }

    setPrefsOpen(false);
    if (nothingChanged) return;

    const nextSignals = draftSignals;
    const nextRamMinApplied = ramChanged ? ramMinDraft : cardRamMinApplied;
    const nextRamMinThreshold =
      Number(nextRamMinApplied) || Number(DEFAULT_RAM_MIN_GB);
    const prevLeadId = cardLead?.id ?? null;
    const nextRanked = rankBy(nextSignals, nextRamMinThreshold);
    const nextLead = nextRanked[0];

    // Compute the agent note text now (same ranking math the states below
    // use) but don't show it yet — it's the last beat, once the cards have
    // actually settled into their new arrangement.
    let noteText: string | null = null;
    if (nextLead) {
      const toggleDescs = signalChanges.map(
        (id) => `turned ${draftSignals[id] ? "on" : "off"} ${SIGNAL_NAMES[id]}`,
      );
      if (ramChanged) toggleDescs.push(`set the minimum to ${ramMinDraft}GB`);
      const keywords = reasonKeywords(
        nextLead,
        nextSignals,
        nextRamMinThreshold,
      );
      // The case that matters most: with three options, the order often
      // doesn't change — say so explicitly, same pick, new reason, rather
      // than closing with no visible effect (point 8).
      const outcome =
        nextLead.id !== prevLeadId
          ? `${nextLead.name} now leads on ${keywords}.`
          : `${nextLead.name} still leads, just on ${keywords} now.`;
      noteText = `${capitalize(toggleDescs.join(", "))}. ${outcome}`;
    }

    clearPendingTimers();
    setAgentNote(null); // hide any previous banner — it reappears at the end

    // Beat 1: headline/subhead/attribution transition.
    after(
      () => {
        setNarrativeSignals(nextSignals);
        setNarrativeRamMinApplied(nextRamMinApplied);
        setHasReranked(true);

        // Beat 2: the current cards fade out + down, staggered.
        after(
          () => {
            setCardsHidden(true);

            // Beat 3: after a slight gap, the new cards fade in + up.
            after(
              () => {
                setCardSignals(nextSignals);
                setCardRamMinApplied(nextRamMinApplied);
                setCardGen((g) => g + 1);
                setCardsHidden(false);

                // Beat 4: the banner arrives last, pushing the cards down.
                after(
                  () => setAgentNote(noteText),
                  reduceMotion ? 0 : CARD_ENTER_SETTLE_MS,
                );
              },
              reduceMotion ? 0 : CARD_EXIT_SETTLE_MS + CARD_GAP_MS,
            );
          },
          reduceMotion ? 0 : HEADLINE_SETTLE_MS,
        );
      },
      reduceMotion ? 0 : POPOVER_CLOSE_MS,
    );
  };

  // The Yoga only gets set aside when the RAM-minimum signal is on AND it
  // genuinely falls short at the current threshold — turning the signal off,
  // or lowering the threshold to something the Yoga clears, un-sets it aside.
  const yogaItem = candidatePool.find((item) => item.id === YOGA_ID);
  const yogaSetAside =
    cardSignals.minRam &&
    Boolean(correctionMade) &&
    (yogaItem ? (ramGb(yogaItem) ?? 0) < cardRamMinThreshold : true);

  // The narrowing, derived from the catalog: how many laptops matched, how
  // many cleared the RAM minimum, and the one picked. Reruns if "Edit this
  // rule" changes the threshold.
  const laptops = CATALOG_ITEMS.filter((item) => item.category === "Laptops");
  const qualifying = laptops.filter(
    (item) => (ramGb(item) ?? 0) >= cardRamMinThreshold,
  );

  // Thread entry: live once the pick has resolved, not gated on any click.
  useEffect(() => {
    if (!lead || output.loading) return;
    const summary = `Narrowed ${laptops.length} laptops to ${qualifying.length} that meet your ${cardRamMinThreshold}GB minimum, picked the ${lead.name}.`;
    const detail = [
      `${laptops.length} laptops in the catalog matched your request.`,
      `${qualifying.length} met the ${cardRamMinThreshold}GB minimum.`,
      `Picked ${lead.name}: best price after EPP and meets full spec.`,
    ];
    addStepEntry("choose", summary, detail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    lead,
    output.loading,
    laptops.length,
    qualifying.length,
    cardRamMinThreshold,
  ]);

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
  // Exhaustive, given candidatePool always includes `lead` above — narrows
  // narrativeLead/cardLead to non-optional for the JSX below.
  if (!narrativeLead || !cardLead) return null;

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
                {/* `mode="wait"` — the old name fully fades out + up before
                    the new one fades in + up, so they never collide
                    mid-transition. Plain `inline` span (not inline-block)
                    matches the original static markup exactly, keeping the
                    highlight's baseline/line-height aligned with the rest of
                    the headline. */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={hasReranked ? narrativeLead.id : "default"}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }
                    }
                    transition={{
                      duration: reduceMotion ? 0 : 0.2,
                      ease: EASE,
                    }}
                    className="inline-block rounded px-1"
                    style={{ backgroundImage: "var(--ai-gradient)" }}
                  >
                    {hasReranked ? shortItemName(narrativeLead) : "X1 Carbon"}
                  </motion.span>
                </AnimatePresence>{" "}
                is the closest fit to your request
              </motion.h1>
              {/* Subhead: product reasons only, identical at both tiers —
                  the heading block is a pure insertion below, no
                  substitution. Once a re-rank has happened, it's regenerated
                  from what's actually still on — "X1 Carbon is the closest
                  fit" can't persist unchanged if the basis for it has
                  (points 4, 6, 8). Same out-and-up / in-and-up idiom as the
                  headline, same `mode="wait"` so they don't collide. */}
              <motion.p
                variants={headingLine}
                className="mt-1.5 text-sm leading-6 text-muted-foreground"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={
                      hasReranked
                        ? buildSubhead(
                            narrativeLead,
                            narrativeSignals,
                            narrativeRamMinThreshold,
                          )
                        : "default"
                    }
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.18,
                      ease: EASE,
                    }}
                    className="block"
                  >
                    {hasReranked
                      ? buildSubhead(
                          narrativeLead,
                          narrativeSignals,
                          narrativeRamMinThreshold,
                        )
                      : `Best price after EPP, and it clears your ${narrativeRamMinThreshold}GB minimum.`}
                  </motion.span>
                </AnimatePresence>
              </motion.p>
              {/* Attribution — smallest, muted, provenance only. P2-only
                  insertion, not a substitution — P1 has no attribution
                  line. Once reranked, cites only signals still on (point 5),
                  and transitions the same way as its siblings above. */}
              <P2>
                <motion.p
                  variants={headingLine}
                  className="mt-1 text-xs text-muted-foreground"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={
                        hasReranked
                          ? buildAttribution(narrativeSignals)
                          : "default"
                      }
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }
                      }
                      transition={{
                        duration: reduceMotion ? 0 : 0.16,
                        ease: EASE,
                      }}
                      className="inline-block"
                    >
                      {hasReranked
                        ? buildAttribution(narrativeSignals)
                        : "From your team's May order and the Design contractor spec."}
                    </motion.span>
                  </AnimatePresence>{" "}
                  <Popover open={prefsOpen} onOpenChange={openPrefs}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="underline hover:text-foreground"
                      >
                        Update my preferences
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 text-left">
                      <PreferencesPanel
                        draftSignals={draftSignals}
                        onSignalChange={(id, on) =>
                          setDraftSignals((prev) => ({ ...prev, [id]: on }))
                        }
                        ramMinDraft={ramMinDraft}
                        onRamMinDraftChange={setRamMinDraft}
                        editingRamRule={editingRamRule}
                        onEditingRamRuleChange={setEditingRamRule}
                        persistence={persistence}
                        onPersistenceChange={setPersistence}
                        onCancel={() => setPrefsOpen(false)}
                        onApply={applyPrefs}
                      />
                    </PopoverContent>
                  </Popover>
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
              {/* P1 never reranks — no popover, so this stays exactly the
                  original, static presentation. */}
              <P1>
                <MatchCard
                  item={lead}
                  lead
                  index={0}
                  onOpenDetail={
                    onOpenDetail ? () => onOpenDetail(lead) : undefined
                  }
                />
                {alts.map((item, i) => (
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
                ))}
              </P1>
              {/* P2: the card list is a full exit-then-enter each re-rank
                  (see MatchCard) rather than a physical FLIP — `cardGen` in
                  each key forces that, so `lead`/rationale are just part of
                  a card's normal mount, never updated in place. */}
              <P2>
                {/* `minHeight` (measured in the layout effect above) floors
                    just this inner wrapper — not the outer list container —
                    at the tallest it's actually shown. The list fully empties
                    for a beat between the old cards exiting and the new ones
                    entering; flooring the OUTER container alone doesn't help,
                    since the escalation strip below is a sibling inside the
                    same space-y-3 stack and just flows up to fill the gap
                    regardless of the container's overall height. Reserving
                    space on this specific wrapper is what actually holds it
                    down. `layout` smooths anything still left over (e.g. the
                    very first measurement, before a floor exists). */}
                <motion.div
                  ref={cardListRef}
                  layout
                  transition={{ layout: { duration: 0.32, ease: CARD_EASE } }}
                  style={{ minHeight: minListHeight }}
                  className="space-y-3"
                >
                  {/* Agent note — the last beat. Its own height (not just
                    opacity) grows in, so it visibly pushes the settled cards
                    down rather than overlaying them. Sits above the list in
                    the DOM for exactly that reason. */}
                  <AnimatePresence initial={false}>
                    {agentNote && (
                      <motion.div
                        key="agent-note"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          marginBottom: 20,
                        }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{
                          height: {
                            duration: reduceMotion ? 0 : 0.32,
                            ease: EASE,
                          },
                          marginBottom: {
                            duration: reduceMotion ? 0 : 0.32,
                            ease: EASE,
                          },
                          opacity: {
                            duration: reduceMotion ? 0 : 0.24,
                            ease: EASE,
                          },
                        }}
                        className="overflow-hidden rounded-lg [background-image:var(--ai-gradient)]"
                      >
                        <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-foreground">
                          <span>{agentNote}</span>
                          <button
                            type="button"
                            onClick={() => setAgentNote(null)}
                            aria-label="Dismiss"
                            className="shrink-0 text-foreground/70 hover:text-foreground"
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {cardRanked.length > 0 && (
                    <AnimatePresence mode="popLayout" initial={false}>
                      {!cardsHidden &&
                        cardRanked.map((item, i) => {
                          const isLead = i === 0;
                          const rationale =
                            hasReranked && isLead
                              ? leadRationaleFlags(
                                  item,
                                  cardSignals,
                                  cardRamMinThreshold,
                                )
                              : undefined;
                          const notPicked = isLead
                            ? undefined
                            : hasReranked
                              ? dynamicNotPickedReason(
                                  item,
                                  cardLead,
                                  cardSignals,
                                  cardRamMinThreshold,
                                  Boolean(correctionMade),
                                )
                              : NOT_PICKED_REASONS[item.id];
                          const key = `${item.id}-g${cardGen}`;

                          if (item.id === YOGA_ID) {
                            return (
                              <MatchCard
                                key={key}
                                item={item}
                                lead={isLead}
                                index={i}
                                notPickedReason={
                                  yogaSetAside ? undefined : notPicked
                                }
                                setAside={!isLead && yogaSetAside}
                                onShowAnyway={onYogaShowAnyway}
                                onWhyNotThisClick={
                                  !isLead && !yogaSetAside && onWhyNotThisClick
                                    ? () => onWhyNotThisClick(item)
                                    : undefined
                                }
                                onOpenDetail={
                                  onOpenDetail
                                    ? () => onOpenDetail(item)
                                    : undefined
                                }
                                leadRationale={rationale}
                              />
                            );
                          }
                          return (
                            <MatchCard
                              key={key}
                              item={item}
                              lead={isLead}
                              index={i}
                              notPickedReason={notPicked}
                              onWhyNotThisClick={
                                !isLead && onWhyNotThisClick
                                  ? () => onWhyNotThisClick(item)
                                  : undefined
                              }
                              onOpenDetail={
                                onOpenDetail
                                  ? () => onOpenDetail(item)
                                  : undefined
                              }
                              leadRationale={rationale}
                            />
                          );
                        })}
                    </AnimatePresence>
                  )}
                </motion.div>
              </P2>

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
