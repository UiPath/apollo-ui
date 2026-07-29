"use client";

import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Plus, ShoppingCart } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { CartDrawer } from "./CartDrawer";
import { useCart } from "./cart-context";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface BuyScaffoldProps {
  /** The active step. Changing it animates the title/subtext out and in. */
  stepKey: string;
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
   * When true, the AI mark + title + subtitle anchor block is hidden. Use on
   * steps that supply their own page-level hero (e.g. the Choose/selection phase).
   */
  hideBrand?: boolean;
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
  title,
  subtext,
  onBack,
  onReset,
  showCart = false,
  phaseBar,
  hideBrand = false,
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

  // Border only when the band has content — absent on Intake where all slots are empty.
  const hasBandContent = !!(onBack ?? onReset ?? phaseBar ?? showCart);

  return (
    <div className="flex h-full flex-col">
      {/* Single chrome band: Back | stepper (centered) | Reset+Cart — hairline beneath. */}
      <div
        className={cn(
          "relative flex h-12 shrink-0 items-center justify-between px-4",
          hasBandContent && "border-b",
        )}
      >
        {/* Back — left */}
        <div className="flex items-center">
          <AnimatePresence>
            {onBack && (
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
                  New purchase request
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
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div
          className={cn(
            "mx-auto flex w-full max-w-[720px] flex-1 flex-col px-4 pb-10",
            hideBrand && "pt-8",
          )}
        >
          {/* Autopilot mark + animated title/subtext. Hidden when the step
              supplies its own hero (hideBrand=true, e.g. the Choose phase). */}
          {!hideBrand && (
            <div className="pt-[7vh] text-center">
              <div className="flex items-center justify-center gap-1.5">
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
                <AiMark size={20} gradientId="buy-ai-mark" />
                <span
                  className="pt-0.5 text-sm font-bold leading-none tracking-tight"
                  style={{
                    backgroundImage: "var(--ai-gradient-text)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  AI Assistant
                </span>
              </div>
              {/* Title + subtext slide up and fade as the step changes. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stepKey}
                  variants={group}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <motion.h1
                    variants={line}
                    className="mt-3 text-2xl font-semibold tracking-tight text-foreground"
                  >
                    {title}
                  </motion.h1>
                  <motion.p
                    variants={line}
                    className="mx-auto mt-1.5 max-w-prose text-sm leading-6 text-muted-foreground"
                  >
                    {subtext}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Step surface, directly beneath the anchor. */}
          <div className="mt-6">{children}</div>
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
