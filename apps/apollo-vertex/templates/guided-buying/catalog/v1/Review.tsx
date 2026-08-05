"use client";

import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info, Plus, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AddItemsDrawer } from "./AddItemsDrawer";
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
  CATALOG_ITEMS,
  defaultQuantityFor,
  displayRequestTitle,
  formatPrice,
  RECOMMENDATION,
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
const DEFAULT_SHIP_TO = "Amsterdam office · Herengracht 124, 1015 BS Amsterdam";
const DEFAULT_NEED_BY = "Standard delivery";

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
  const { items, quantities, setQuantity, remove } = useCart();
  const {
    requestTitle,
    requestDetails,
    hasResolved,
    seedPhase,
    setRequestDetails,
  } = useConversation();
  const [shelfDockOpen, setShelfDockOpen] = useState(false);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const { ref: contentRef, overflowing } = useContentOverflow<HTMLDivElement>();
  const { addStepEntry } = useAssistantThread();

  // /review has no route of its own to recover an in-progress request from —
  // an empty cart means this was reached directly (a deep link or a reload),
  // not by walking the flow. Seed the canonical catalog scenario so the page
  // still shows something real instead of an empty order summary.
  useEffect(() => {
    if (items.length > 0) return;
    const item = CATALOG_ITEMS.find((i) => i.id === RECOMMENDATION.itemId);
    if (item) setQuantity(item, defaultQuantityFor(item));
    seedPhase("selection");
    setRequestDetails({
      approver: DEFAULT_APPROVER,
      costCenter: DEFAULT_COST_CENTER,
      shipTo: DEFAULT_SHIP_TO,
      needBy: DEFAULT_NEED_BY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // reload-only seed — never re-fires as the user empties the cart

  const approver = requestDetails?.approver ?? DEFAULT_APPROVER;
  const costCenter = requestDetails?.costCenter ?? DEFAULT_COST_CENTER;
  const shipTo = requestDetails?.shipTo ?? DEFAULT_SHIP_TO;
  const needBy = requestDetails?.needBy ?? DEFAULT_NEED_BY;
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
                    No procurement review needed, routing straight to{" "}
                    {approverName}.
                  </p>
                </motion.header>

                {/* Order summary (read-only) */}
                <motion.section
                  variants={fadeUpVariants(reduceMotion)}
                  className={cn(...GLASS_CLASSES, "p-4")}
                >
                  <h2 className="mb-1 text-sm font-semibold text-foreground">
                    Order summary
                  </h2>
                  {items.length > 0 ? (
                    <>
                      <div>
                        {items.map((item) => (
                          <CartLine
                            key={item.id}
                            item={item}
                            quantity={quantities[item.id] ?? 1}
                            basis={BASIS}
                            onQtyChange={(quantity) =>
                              setQuantity(item, quantity)
                            }
                            onRemove={() => remove(item)}
                          />
                        ))}
                      </div>
                      {/* Hidden for now, not removed — setAddItemsOpen and
                          AddItemsDrawer below stay wired through the
                          empty-cart state's own trigger. */}
                      <div className="mt-4 border-t pt-4">
                        <CartSummary
                          items={items}
                          quantities={quantities}
                          basis={BASIS}
                          totalLabel="Total"
                          showItemCount={false}
                          showSavingsRow={false}
                          showSavingsCaption
                        />
                      </div>
                    </>
                  ) : (
                    // Emptying the cart stays on this page — no bounce to a
                    // different empty-state screen. Submit disables below;
                    // the add link is the one way forward from here.
                    <div className="space-y-3 py-2 text-center">
                      <p className="text-sm text-muted-foreground">
                        No items in this request.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddItemsOpen(true)}
                      >
                        <Plus className="size-3.5" aria-hidden />
                        Add items from the catalog
                      </Button>
                    </div>
                  )}
                </motion.section>

                {/* Delivery + ship to + need by + approval — same card
                    treatment as Order summary. */}
                <motion.section
                  variants={fadeUpVariants(reduceMotion)}
                  className={cn(...GLASS_CLASSES, "space-y-3 p-4 text-sm")}
                >
                  {items.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery</p>
                      <p className="text-foreground">
                        {items[0].source}.{" "}
                        {items[0].inStock
                          ? "In stock, ships in 2 to 3 business days."
                          : "Backordered, ships in 3 to 4 weeks."}{" "}
                        EPP validated today.
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Ship to</p>
                    <p className="text-foreground">{shipTo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Need by</p>
                    <p className="text-foreground">{needBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Approval</p>
                    <p className="text-foreground">
                      {approver}. {costCenter}.
                    </p>
                  </div>
                </motion.section>

                {/* Green ready-to-submit state — every policy check passed,
                    naming the limit it cleared. Sits above the caveat. */}
                {!needsApproval && (
                  <motion.div variants={fadeUpVariants(reduceMotion)}>
                    <Alert status="success" visual="tinted">
                      <ShieldCheck aria-hidden />
                      <AlertDescription className="text-foreground">
                        All policy checks passed — within your{" "}
                        {formatPrice(APPROVAL_LIMIT, "USD")} approval limit.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

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
              <Button
                disabled={items.length === 0}
                onClick={() => void navigate({ to: "/track" })}
              >
                Submit request
              </Button>
            }
          />
        </div>
      </div>

      <AddItemsDrawer open={addItemsOpen} onOpenChange={setAddItemsOpen} />
    </motion.div>
  );
}
