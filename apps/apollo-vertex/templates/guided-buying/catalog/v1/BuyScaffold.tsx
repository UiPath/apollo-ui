"use client";

import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Plus, ShoppingCart } from "lucide-react";
import type { ReactNode } from "react";
import { AutopilotGradientIcon } from "@/registry/ai-chat/components/icons/autopilot-gradient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart-context";
import { CartDrawer } from "./CartDrawer";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface BuyScaffoldProps {
  /** The active step. Changing it animates the title/subtext out and in. */
  stepKey: string;
  title: string;
  subtext: ReactNode;
  /** Back control (top-left). Omitted on Intake — there's no previous step. */
  onBack?: () => void;
  /** Full reset (top-right "New purchase request"). Omitted on Intake. */
  onReset?: () => void;
  /** Show the cart button — only once products are on screen (it transitions in). */
  showCart?: boolean;
  children: ReactNode;
}

/**
 * The constant frame for every Buy screen: a horizontally centered column with a
 * back/reset bar, the Autopilot mark, and a title + subtext pinned to the same
 * vertical anchor on every step. The mark stays put across steps; the title and
 * subtext slide up and fade (staggered) as the step changes, so moving through
 * the flow reads as one surface re-titling itself. The step's surface renders
 * directly beneath the anchor.
 */
export function BuyScaffold({
  stepKey,
  title,
  subtext,
  onBack,
  onReset,
  showCart = false,
  children,
}: BuyScaffoldProps) {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { count: cartCount, setOpen: setCartOpen } = useCart();

  // Orchestration only — the children carry the visible slide/fade, staggered.
  const group = {
    initial: {},
    // delayChildren holds a beat after the old header has left (mode="wait") so
    // the incoming title/subtext don't read as colliding with the outgoing ones.
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

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-4 pb-10">
        {/* The bar reserves its full button-row height on every step (including
            Intake, which has no controls) so the anchor below never shifts — note
            the reserve must cover the buttons (h-8) plus this pt, since border-box
            folds the padding into min-h. The buttons slide into that space. */}
        <div className="flex min-h-[52px] items-center justify-between gap-2 pt-5">
          {/* Back (left) — slides in once there's a previous step. */}
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
          {/* Reset + the persistent cart — slide into the reserved bar. */}
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
            {/* The cart appears once products are on screen — transitions in. */}
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

        {/* The anchor — Autopilot mark + title + subtext, identical position. */}
        <div className="pt-[7vh] text-center">
          {/* Constant mark — stays put across steps. */}
          <div className="flex items-center justify-center gap-1.5">
            <AutopilotGradientIcon size={20} aria-hidden="true" />
            <span className="bg-clip-text pt-0.5 text-sm font-bold tracking-tight text-transparent [background-image:var(--ai-chat-brand-gradient)]">
              AI Assistant
            </span>
          </div>
          {/* Title + subtext — slide up & fade out/in as the step changes. */}
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

        {/* The step's surface, directly beneath the anchor. */}
        <div className="mt-6">{children}</div>
      </div>

      {/* The cart peek — shared cart state; Review opens the full Review page. */}
      <CartDrawer
        onReviewSubmit={() => {
          setCartOpen(false);
          void navigate({ to: "/review" });
        }}
      />
    </div>
  );
}
