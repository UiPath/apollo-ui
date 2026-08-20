"use client";

import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Plus, ShoppingCart } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { CartDrawer } from "./CartDrawer";
import { useCart } from "./cart-context";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Marcus's own long-standing value, unchanged from before this prop
// existed. His own phase bar (four phases, short labels) stays narrow at
// every width this app is used at, so this was never the source of the
// reported collision and needs no tightening on his account. Kept as the
// default so a caller that doesn't pass headerTitleMaxWidth renders
// exactly as it always has.
const DEFAULT_HEADER_TITLE_MAX_WIDTH = "max-w-[320px]";

/** Splits a filename at its final dot so the extension can stay fixed while
 * only the leading portion truncates, the elision landing between the two
 * rather than swallowing the extension's own meaning. No extension found
 * (no dot, or a leading dot only) returns the whole string as the base. */
function splitFilename(filename: string): { base: string; extension: string } {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return { base: filename, extension: "" };
  return {
    base: filename.slice(0, dotIndex),
    extension: filename.slice(dotIndex),
  };
}

interface BuyScaffoldProps {
  /** The active step. Changing it animates the title/subtext out and in. */
  stepKey: string;
  /** Small line above the title, e.g. a time-of-day greeting on Intake. Carries
   * the AI mark; when present, the title itself steps up a size and loses its
   * own mark. */
  eyebrow?: ReactNode;
  title: string;
  subtext: ReactNode;
  /** Back control (top-left). Omitted on Intake — there's no previous step. */
  onBack?: () => void;
  /** Full reset (top-right). Omitted on Intake. */
  onReset?: () => void;
  /** Show the cart button — only once products are on screen. */
  showCart?: boolean;
  /** Flow phase indicator rendered centered in the chrome band. */
  phaseBar?: ReactNode;
  /**
   * The current request in the user's own words (or "New request" before one
   * exists) — the chrome band's left-slot thread title, in place of onBack.
   */
  headerTitle: string;
  /** "end" (default): CSS ellipsis at the tail, how a typed ask has always
   * truncated. "middle": splits headerTitle at its final dot and truncates
   * only the leading portion, keeping the extension intact and adding a
   * tooltip with the untruncated string, for a filename whose extension
   * carries meaning. Additive: existing callers omit this and render
   * exactly as before. */
  headerTitleTruncate?: "end" | "middle";
  /** Reserves the left slot's own width (a Tailwind arbitrary max-width
   * class, e.g. "max-w-[320px]") so it always leaves a gutter before the
   * centered phase bar. Defaults to Marcus's own value. A caller whose own
   * phase bar is wider (more phases, longer labels) needs a tighter budget
   * to keep a real gutter and should pass its own, computed against its
   * own phase bar rather than this component guessing at it. */
  headerTitleMaxWidth?: string;
  /** True while the assistant panel is open — hides the header's own trigger. */
  assistantOpen: boolean;
  /** Opens the assistant panel (the header's ✦ trigger, beside the title). */
  onOpenAssistant: () => void;
  /**
   * When true, the AI mark + title + subtitle anchor block is hidden. Use on
   * steps that supply their own page-level hero (e.g. the Choose/selection phase).
   */
  hideBrand?: boolean;
  /** Attached to the scrollable content column — lets a parent measure overflow. */
  contentRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}

/**
 * The constant frame for every Buy screen. One chrome band — Back left,
 * stepper centered (absolutely positioned so flanking button widths don't
 * shift it), Reset + Cart right, hairline beneath. Below that, a scrollable
 * column with the Autopilot mark, animated title/subtext, and the step surface.
 */
export function BuyScaffold({
  stepKey,
  eyebrow,
  title,
  subtext,
  onBack,
  onReset,
  showCart = false,
  phaseBar,
  hideBrand = false,
  headerTitle,
  headerTitleTruncate = "end",
  headerTitleMaxWidth = DEFAULT_HEADER_TITLE_MAX_WIDTH,
  assistantOpen,
  onOpenAssistant,
  contentRef,
  children,
}: BuyScaffoldProps) {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { count: cartCount, setOpen: setCartOpen } = useCart();

  const group = {
    initial: {},
    animate: { transition: { staggerChildren: 0.08, delayChildren: 0.18 } },
    exit: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  };
  const line = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 10 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.28, ease: EASE },
        },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: EASE } },
      };

  // Border + thread title only once a request exists — absent on the blank
  // Intake screen (before the first prompt or resume) where all slots are empty.
  const hasBandContent = !!(onBack ?? onReset ?? phaseBar ?? showCart);

  return (
    <div className="flex h-full flex-col">
      {/* Single chrome band: Back/thread title | stepper (centered) | Reset+Cart — hairline beneath. */}
      <div
        className={cn(
          "relative flex h-12 shrink-0 items-center justify-between px-4",
          hasBandContent && "border-b",
        )}
      >
        {/* Back — left. When a step keeps Back off the header (it renders its
            own, e.g. Bridge's closing row), the thread title takes that slot
            instead: the current request, plus the panel's own open trigger. */}
        <div className="flex min-w-0 items-center">
          <AnimatePresence mode="wait">
            {onBack ? (
              <motion.div
                key="back"
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
                transition={{
                  duration: 0.28,
                  ease: EASE,
                  delay: reduceMotion ? 0 : 0.15,
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="-ml-2 text-muted-foreground"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Back
                </Button>
              </motion.div>
            ) : (
              hasBandContent && (
                <motion.div
                  key="thread-title"
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  transition={{
                    duration: 0.28,
                    ease: EASE,
                    delay: reduceMotion ? 0 : 0.15,
                  }}
                  className="flex min-w-0 items-center gap-1.5"
                >
                  {!assistantOpen && (
                    <>
                      <svg
                        width={0}
                        height={0}
                        aria-hidden
                        className="absolute"
                      >
                        <defs>
                          <linearGradient
                            id="back-slot-ai-mark"
                            x1="2"
                            y1="4"
                            x2="22"
                            y2="20"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop
                              offset="0"
                              stopColor="var(--ai-gradient-start)"
                            />
                            <stop
                              offset="1"
                              stopColor="var(--ai-gradient-end)"
                            />
                          </linearGradient>
                        </defs>
                      </svg>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onOpenAssistant}
                        aria-label="Open assistant"
                        className="shrink-0"
                      >
                        <AiMark size={16} gradientId="back-slot-ai-mark" />
                      </Button>
                    </>
                  )}
                  {headerTitleTruncate === "middle" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            headerTitleMaxWidth,
                            "flex min-w-0 items-center text-xs font-semibold text-foreground",
                          )}
                        >
                          <span className="truncate">
                            {splitFilename(headerTitle).base}
                          </span>
                          <span className="shrink-0">
                            {splitFilename(headerTitle).extension}
                          </span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{headerTitle}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <span
                      title={headerTitle}
                      className={cn(
                        headerTitleMaxWidth,
                        "truncate text-xs font-semibold text-foreground",
                      )}
                    >
                      {headerTitle}
                    </span>
                  )}
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Stepper — absolutely centered, independent of flanking button widths. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">{phaseBar}</div>
        </div>

        {/* Reset + Cart — right */}
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {onReset && (
              <motion.div
                key="reset"
                initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 8 }}
                transition={{
                  duration: 0.28,
                  ease: EASE,
                  delay: reduceMotion ? 0 : 0.15,
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  className="text-muted-foreground"
                >
                  <Plus className="size-4" aria-hidden />
                  New request
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showCart && (
              <motion.div
                key="cart"
                initial={
                  reduceMotion ? false : { opacity: 0, x: 8, scale: 0.9 }
                }
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: 8, scale: 0.9 }
                }
                transition={{ duration: 0.28, ease: EASE }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCartOpen(true)}
                  className="gap-2 text-muted-foreground"
                  aria-label="Open cart"
                >
                  <ShoppingCart className="size-4" aria-hidden />
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      animate={reduceMotion ? {} : { scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.32, ease: EASE }}
                      className="inline-flex"
                    >
                      <Badge variant="secondary" className="px-1.5">
                        {cartCount}
                      </Badge>
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scrollable content — anchor (when shown) + step surface. */}
      <div ref={contentRef} className="flex flex-1 flex-col overflow-y-auto">
        <div
          className={cn(
            // pb-24 rather than pb-10: FlowFooterBar's own rendered height
            // (py-4 around an h-8 button, ~64px) is taller than pb-10 (40px)
            // reserved, so a full-length step's last row could sit right up
            // against the footer once scrolled to the end. pb-24 (96px)
            // clears it with margin, for every step, not just one.
            "mx-auto flex w-full max-w-[720px] flex-1 flex-col px-4 pb-24",
            // hideBrand steps supply their own hero (e.g. Choose) — same
            // pt-[7vh] anchor as the shared title block, so the two screens
            // place their headline at the same height.
            hideBrand && "pt-[7vh]",
          )}
        >
          {/* Autopilot mark + animated title/subtext. Hidden when the step
              supplies its own hero (hideBrand=true, e.g. the Choose phase). */}
          {!hideBrand && (
            <div className="pt-[7vh] text-center">
              <svg width={0} height={0} aria-hidden className="absolute">
                <defs>
                  <linearGradient
                    id="buy-ai-mark"
                    x1="2"
                    y1="4"
                    x2="22"
                    y2="20"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="var(--ai-gradient-start)" />
                    <stop offset="1" stopColor="var(--ai-gradient-end)" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Title + subtext slide up and fade as the step changes. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stepKey}
                  variants={group}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {eyebrow && (
                    <motion.p
                      variants={line}
                      className="flex items-center justify-center gap-1.5 text-sm font-semibold tracking-tight text-foreground"
                    >
                      <AiMark size={16} gradientId="buy-ai-mark" />
                      {eyebrow}
                    </motion.p>
                  )}
                  <motion.h1
                    variants={line}
                    className={cn(
                      "text-2xl font-semibold text-foreground",
                      eyebrow
                        ? "mt-1.5 text-3xl tracking-[-1px]"
                        : "tracking-tight",
                    )}
                  >
                    {title}
                  </motion.h1>
                  {subtext && (
                    <motion.p
                      variants={line}
                      className="mx-auto mt-1.5 max-w-prose text-sm leading-6 text-muted-foreground"
                    >
                      {subtext}
                    </motion.p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Step surface, directly beneath the anchor. hideBrand steps carry
              their own heading as part of children, so skip the extra gap —
              it would double up with the shared anchor's spacing. */}
          <div className={cn(!hideBrand && "mt-6")}>{children}</div>
        </div>

        <CartDrawer
          onReviewSubmit={() => {
            setCartOpen(false);
            void navigate({ to: "/review" });
          }}
        />
      </div>
    </div>
  );
}
