"use client";

import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAssistantThread } from "./assistant-thread-context";
import { BuyScaffold } from "./BuyScaffold";
import { CartLine } from "./CartLine";
import { CartSummary } from "./CartSummary";
import { useCart } from "./cart-context";
import { useConversation } from "./conversation-context";
import {
  APPROVAL_LIMIT,
  activePrice,
  activeSavings,
  displayRequestTitle,
  formatPrice,
} from "./data";
import { FlowFooterBar } from "./FlowFooter";
import { CATALOG_PHASES, FlowPhaseBar } from "./FlowPhaseBar";
import { ShelfDock } from "./ShelfDock";
import { useContentOverflow } from "./use-content-overflow";

// Review commits the EPP-priced catalog scenario.
const BASIS = "epp" as const;

// Bridge defaults — used when Review is reached without a resolved Bridge
// (e.g. the catalog path); the Bridge overrides these when it confirms.
const DEFAULT_APPROVER = "Alex Chen · Design Director";
const DEFAULT_COST_CENTER = "Design Operations · CC-4421";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Headline, Order summary, and Delivery/Approval stagger in ~110ms apart —
// same vocabulary as the Bridge's field-by-field reveal and the Done screen's
// headline-then-cards sequence, so arriving at Review reads as a step in the
// same flow rather than a flat, barely-visible fade.
const contentVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.11 } },
};

function fadeUpVariants(reduceMotion: boolean | null) {
  return reduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: EASE },
        },
      };
}

/** Review & submit — the commit surface for the catalog path. */
export function Review() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { items, quantities, setOpen } = useCart();
  const { requestTitle, requestDetails, hasResolved } = useConversation();
  const [shelfDockOpen, setShelfDockOpen] = useState(false);
  const { ref: contentRef, overflowing } = useContentOverflow<HTMLDivElement>();
  const { addStepEntry } = useAssistantThread();

  const approver = requestDetails?.approver ?? DEFAULT_APPROVER;
  const costCenter = requestDetails?.costCenter ?? DEFAULT_COST_CENTER;
  // First name only in the subhead sentence — the full "Name · Title" reads
  // oddly inline; the title still shows in the routing strip below.
  const approverName = approver.split(" · ")[0];

  const total = items.reduce(
    (sum, i) => sum + activePrice(i, BASIS) * (quantities[i.id] ?? 0),
    0,
  );
  const savings = items.reduce(
    (sum, i) => sum + activeSavings(i, BASIS) * (quantities[i.id] ?? 0),
    0,
  );
  const needsApproval = total > APPROVAL_LIMIT;

  // Thread entry: live, derived from the same numbers the page itself shows.
  useEffect(() => {
    if (items.length === 0) return;
    const summary = needsApproval
      ? `Checked policy: over your ${formatPrice(APPROVAL_LIMIT, "USD")} limit, needs approval.`
      : `Checked policy: within limit, ${formatPrice(savings, "USD")} saved with EPP.`;
    const detail = [
      needsApproval
        ? `Over your ${formatPrice(APPROVAL_LIMIT, "USD")} limit.`
        : `Within your ${formatPrice(APPROVAL_LIMIT, "USD")} limit, no procurement review needed.`,
      `${formatPrice(savings, "USD")} saved applying EPP pricing.`,
      `Routes to ${approver} for approval.`,
    ];
    addStepEntry("review", summary, detail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, needsApproval, savings, approver]);

  const editCart = () => {
    setOpen(true);
    void navigate({ to: "/catalog" });
  };

  // Review is reached from two different shelves — the guided /buy flow's
  // matches, or the standalone /catalog page's cart drawer. Back returns to
  // whichever one it actually was, not a hardcoded destination. `from` isn't
  // a registered history-state key (see Selection.tsx's reviewSubmit), hence the cast.
  const cameFromCatalog = useRouterState({
    // biome-ignore lint/suspicious/noExplicitAny: see comment above
    select: (s) => (s.location.state as any).from === "catalog",
  });
  const goBack = () =>
    cameFromCatalog
      ? void navigate({ to: "/catalog" })
      : void navigate({ to: "/buy", state: { fromReview: true } });

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Your cart is empty.</p>
        <Button
          variant="outline"
          onClick={() => void navigate({ to: "/catalog" })}
        >
          Back to catalog
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className="flex h-full"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Left, same slot as the shell sidebar — matches Intake/Bridge/Shelf. */}
      <AnimatePresence>
        {shelfDockOpen && (
          <ShelfDock
            subject={null}
            context="review"
            onClose={() => setShelfDockOpen(false)}
            onCorrectionMade={() => {}}
          />
        )}
      </AnimatePresence>
      <div className="relative min-w-0 flex-1">
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <BuyScaffold
              contentRef={contentRef}
              stepKey="review"
              title="Review & submit"
              subtext={undefined}
              hideBrand
              phaseBar={
                <FlowPhaseBar
                  phases={CATALOG_PHASES}
                  currentIndex={2}
                  onClickPhase={goBack}
                />
              }
              headerTitle={displayRequestTitle(requestTitle, hasResolved)}
              assistantOpen={shelfDockOpen}
              onOpenAssistant={() => setShelfDockOpen(true)}
            >
              <motion.div
                variants={contentVariants}
                initial="initial"
                animate="animate"
                className="space-y-6"
              >
                {/* Headline names what happens next; subhead explains why.
                    The ✦ mark lives in the header now, not here. */}
                <motion.header
                  variants={fadeUpVariants(reduceMotion)}
                  className="space-y-1.5 text-center"
                >
                  <h1 className="text-2xl font-semibold leading-snug text-foreground">
                    Ready for {approverName}&apos;s approval
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Within your {formatPrice(APPROVAL_LIMIT, "USD")} limit, so
                    no procurement review is needed.
                  </p>
                </motion.header>

                {/* Order summary (read-only) */}
                <motion.section
                  variants={fadeUpVariants(reduceMotion)}
                  className={cn(...GLASS_CLASSES, "p-4")}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground">
                      Order summary
                    </h2>
                    <Button variant="ghost" size="sm" onClick={editCart}>
                      <Pencil className="size-4" />
                      Edit cart
                    </Button>
                  </div>
                  <div>
                    {items.map((item) => (
                      <CartLine
                        key={item.id}
                        item={item}
                        quantity={quantities[item.id] ?? 1}
                        basis={BASIS}
                        readOnly
                      />
                    ))}
                  </div>
                  <div className="mt-4 border-t pt-4">
                    <CartSummary
                      items={items}
                      quantities={quantities}
                      basis={BASIS}
                      totalLabel="Total"
                      showItemCount={false}
                      showSubtotal
                    />
                  </div>
                </motion.section>

                {/* Delivery + approval — same card treatment as Order summary. */}
                <motion.section
                  variants={fadeUpVariants(reduceMotion)}
                  className={cn(...GLASS_CLASSES, "space-y-3 p-4 text-sm")}
                >
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <p className="text-foreground">
                      {items[0].source},{" "}
                      {items[0].inStock
                        ? "ships in 2 to 3 business days"
                        : "backordered, 3 to 4 weeks"}
                      . EPP validated today.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Approval</p>
                    <p className="text-foreground">
                      {approver}. {costCenter}.
                    </p>
                  </div>
                </motion.section>

                {/* Caveat sits below everything it discloses, just above the
                    action bar. */}
                <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" aria-hidden />
                  The output is AI generated. Please review.
                </p>
              </motion.div>
            </BuyScaffold>
          </div>

          <FlowFooterBar
            bordered={overflowing}
            left={
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
            }
            right={
              <Button onClick={() => void navigate({ to: "/track" })}>
                Submit request
              </Button>
            }
          />
        </div>
      </div>
    </motion.div>
  );
}
