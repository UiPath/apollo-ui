"use client";

import { useNavigate } from "@tanstack/react-router";
import {
  AnimatePresence,
  motion,
  useAnimation,
  useReducedMotion,
} from "framer-motion";
import { Clock, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { JourneyBar } from "../../JourneyBar";
import { formatDateDisplay, getRequestDetail } from "../../requests/data";
import { useRequests } from "../../requests/requests-context";
import { useAssistantThread } from "./assistant-thread-context";
import { BuyScaffold } from "./BuyScaffold";
import { useCart } from "./cart-context";
import { useConversation } from "./conversation-context";
import {
  activePrice,
  activeSavings,
  displayRequestTitle,
  formatPrice,
} from "./data";
import { FlowFooterBar } from "./FlowFooter";
import { CATALOG_PHASES, FlowPhaseBar } from "./FlowPhaseBar";
import { BrandMark } from "./ScanRow";
import { ShelfDock } from "./ShelfDock";
import { useContentOverflow } from "./use-content-overflow";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Catalog standard config prices under EPP.
const BASIS = "epp" as const;

const REQUEST_ID = "REQ-2052";

// Bridge defaults — used if Review is reached without a resolved Bridge.
const DEFAULT_APPROVER = "Alex Chen · Design Director";
const DEFAULT_COST_CENTER = "Design Operations · CC-4421";

// Headline, subhead, and the two cards stagger in ~110ms apart, starting once
// the confirmation check has had its moment (see ConfirmCheck below).
const contentVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.11, delayChildren: 0.5 } },
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

/**
 * The success cue: a ring pulses out from the circle as it scales in with a
 * slight overshoot, then the check mark draws in (stroke-dashoffset via
 * `pathLength`, not a fade). Runs once via imperative controls in a
 * mount-only effect — re-renders (tier toggle, cart updates) never replay it.
 */
function ConfirmCheck({ reduceMotion }: { reduceMotion: boolean | null }) {
  const ring = useAnimation();
  const circle = useAnimation();
  const check = useAnimation();

  useEffect(() => {
    if (reduceMotion) {
      ring.set({ opacity: 0 });
      circle.set({ scale: 1 });
      check.set({ pathLength: 1 });
      return;
    }
    ring.start({
      scale: [1, 1.7],
      opacity: [0.55, 0],
      transition: { duration: 0.6, delay: 0.1, ease: "easeOut" },
    });
    circle.start({
      scale: [0, 1.15, 1],
      transition: { duration: 0.5, ease: EASE },
    });
    check.start({
      pathLength: 1,
      transition: { duration: 0.4, delay: 0.26, ease: EASE },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // play once, on mount only — not on re-render

  return (
    <div className="relative mx-auto flex size-10 items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full bg-(--primary)"
        initial={{ opacity: 0 }}
        animate={ring}
        aria-hidden
      />
      <motion.span
        className="relative flex size-10 items-center justify-center rounded-full bg-(--primary) text-white"
        initial={{ scale: 0 }}
        animate={circle}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
          <motion.path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={check}
          />
        </svg>
      </motion.span>
    </div>
  );
}

/**
 * The catalog submission finish line (the `/track` destination). Twin of the
 * Configure success screen: an outcome headline, an agent line naming where the
 * request went and what's next, a quiet recap (from the cart + Bridge envelope),
 * and one primary exit. Catalog standard config routes straight to the approver
 * (no procurement), so the destination here is Alex Chen, not procurement.
 */
export function CatalogSubmitted() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { items, quantities, clear } = useCart();
  const { requestText, requestTitle, requestDetails, hasResolved, startFresh } =
    useConversation();
  const { submitRequest } = useRequests();
  const { addStepEntry } = useAssistantThread();
  const { ref: contentRef, overflowing } = useContentOverflow<HTMLDivElement>();
  const [shelfDockOpen, setShelfDockOpen] = useState(false);

  const approver = requestDetails?.approver ?? DEFAULT_APPROVER;
  const costCenter = requestDetails?.costCenter ?? DEFAULT_COST_CENTER;
  const approverName = approver.split(" · ")[0];

  const total = items.reduce(
    (sum, i) => sum + activePrice(i, BASIS) * (quantities[i.id] ?? 0),
    0,
  );
  const savings = items.reduce(
    (sum, i) => sum + activeSavings(i, BASIS) * (quantities[i.id] ?? 0),
    0,
  );

  // Register this submission in the shared requests log (idempotent via provider).
  const hasSubmitted = useRef(false);
  useEffect(() => {
    if (hasSubmitted.current || items.length === 0) return;
    hasSubmitted.current = true;
    const today = formatDateDisplay(new Date());
    const totalQty = items.reduce((sum, i) => sum + (quantities[i.id] ?? 1), 0);
    const cartDesc =
      items.length === 1
        ? `${quantities[items[0].id] ?? 1} ${items[0].name.replace(/^Lenovo /, "")}`
        : `${totalQty} items`;
    submitRequest({
      id: REQUEST_ID,
      // The chrome title — same generated title the header and Bridge show,
      // not a re-derived cart description (that was the source of the old
      // "one request, two titles" mismatch with the detail page).
      request: requestTitle ?? cartDesc,
      // The verbatim prompt, preserved for the detail sidebar's "Your
      // request" field — never shown truncated.
      prompt: requestText ?? undefined,
      requester: "Marcus Webb",
      supplier: items[0]?.vendor ?? "Lenovo",
      department: costCenter.split(" · ")[0],
      amount: formatPrice(total, "USD"),
      amountValue: total,
      status: "pending-approval",
      submitted: today,
      updated: today,
    });
    addStepEntry("done", `Submitted. With ${approverName} for approval.`, [
      `Request ${REQUEST_ID} submitted.`,
      `With ${approver} for approval.`,
      "You'll be notified when it's decided.",
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fire once on mount

  // The request is submitted — leaving empties the cart for the next one.
  const backToBuy = () => {
    clear();
    void navigate({ to: "/buy" });
  };

  // Header's "New request" — same destination as Back to Buy; the reset
  // itself happens once BuyFlow mounts fresh at /buy.
  const startNewRequest = () => {
    clear();
    startFresh();
    void navigate({ to: "/buy" });
  };

  return (
    <motion.div
      className="flex h-full"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Left, same slot as the shell sidebar — matches Bridge/Shelf/Review. */}
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
              stepKey="submitted"
              title="Request submitted"
              subtext={undefined}
              hideBrand
              phaseBar={
                <FlowPhaseBar phases={CATALOG_PHASES} currentIndex={3} />
              }
              onReset={startNewRequest}
              headerTitle={displayRequestTitle(requestTitle, hasResolved)}
              assistantOpen={shelfDockOpen}
              onOpenAssistant={() => setShelfDockOpen(true)}
            >
              <motion.div
                variants={contentVariants}
                initial="initial"
                animate="animate"
              >
                {/* Outcome — success cue centered above the headline, matching
                    the text-only headlines on Bridge/Shelf/Review. Plays
                    immediately, ahead of the staggered content below. */}
                <ConfirmCheck reduceMotion={reduceMotion} />

                <motion.h1
                  variants={fadeUpVariants(reduceMotion)}
                  className="mt-4 text-center text-2xl font-semibold tracking-tight text-foreground"
                >
                  Request submitted
                </motion.h1>
                <motion.p
                  variants={fadeUpVariants(reduceMotion)}
                  className="mt-1.5 text-center text-sm text-muted-foreground"
                >
                  {`It's with ${approverName} for approval. You'll be notified when it's decided.`}
                </motion.p>

                {/* Recap as a receipt: reference number, item + thumbnail, the
                    total as the card's largest element, then the two routing
                    fields quietly below a divider. */}
                {items.length > 0 && (
                  <motion.section
                    variants={fadeUpVariants(reduceMotion)}
                    className={cn(...GLASS_CLASSES, "mt-6 p-4 text-sm")}
                  >
                    <p className="text-xs text-muted-foreground">
                      Request {REQUEST_ID}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <BrandMark item={items[0]} />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        {items.map((item) => (
                          <p
                            key={item.id}
                            className="truncate font-medium text-foreground"
                          >
                            {quantities[item.id] ?? 0} × {item.name}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-2xl font-semibold tracking-tight text-foreground">
                        {formatPrice(total, "USD")}
                      </p>
                      {savings > 0 && (
                        <p className="mt-0.5 text-sm font-medium text-success">
                          EPP savings {formatPrice(savings, "USD")} applied
                        </p>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Charged to
                        </p>
                        <p className="text-foreground">{costCenter}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Routed to
                        </p>
                        <p className="text-foreground">{approver}</p>
                      </div>
                    </div>
                  </motion.section>
                )}

                {/* Approval chain — what happens next after submission. Same
                    card treatment as the recap above. */}
                <motion.section
                  variants={fadeUpVariants(reduceMotion)}
                  className={cn(...GLASS_CLASSES, "mt-6 px-4 py-3.5")}
                >
                  <p className="mb-3 text-xs font-semibold text-muted-foreground">
                    What happens next
                  </p>
                  <JourneyBar
                    stages={[
                      { label: "Submitted · Jul 21", state: "done" },
                      { label: "Approval · Alex Chen", state: "active" },
                      { label: "PO sent", state: "upcoming" },
                      { label: "Received", state: "upcoming" },
                    ]}
                    ownerNote={
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3 shrink-0" aria-hidden />
                        {getRequestDetail(REQUEST_ID)?.journeyOwnerNote}
                      </span>
                    }
                  />
                </motion.section>

                {/* Caveat sits just above the action bar — this screen predicts
                    a decision timeline, same disclosure as the other AI surfaces. */}
                <p className="mt-6 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" aria-hidden />
                  The output is AI generated. Please review.
                </p>
              </motion.div>
            </BuyScaffold>
          </div>

          {/* Track this request is primary — it's the natural next step;
              Back to Buy is secondary. The request also lives on in My Requests. */}
          <FlowFooterBar
            bordered={overflowing}
            left={
              <Button variant="outline" onClick={backToBuy}>
                Back to Buy
              </Button>
            }
            right={
              <Button
                onClick={() => {
                  clear();
                  void navigate({
                    to: "/requests/$id",
                    params: { id: REQUEST_ID },
                  });
                }}
              >
                Track this request
              </Button>
            }
          />
        </div>
      </div>
    </motion.div>
  );
}
