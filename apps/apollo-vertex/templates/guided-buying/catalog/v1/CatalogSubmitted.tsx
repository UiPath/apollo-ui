"use client";

import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ConfirmCheck } from "../../ConfirmCheck";
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
  CATALOG_ITEMS,
  defaultQuantityFor,
  displayRequestTitle,
  formatPrice,
  RECOMMENDATION,
} from "./data";
import { FlowFooterBar } from "./FlowFooter";
import { FlowPhaseBar } from "./FlowPhaseBar";
import { CATALOG_PHASES } from "./flow-phases";
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
const DEFAULT_SHIP_TO = "Amsterdam office · Herengracht 124, 1015 BS Amsterdam";
const DEFAULT_NEED_BY = "Standard delivery";

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
 * The catalog submission finish line (the `/track` destination). Twin of the
 * Configure success screen: an outcome headline, an agent line naming where the
 * request went and what's next, a quiet recap (from the cart + Bridge envelope),
 * and one primary exit. Catalog standard config routes straight to the approver
 * (no procurement), so the destination here is Alex Chen, not procurement.
 */
export function CatalogSubmitted() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { items, quantities, clear, setQuantity } = useCart();
  const {
    requestText,
    requestTitle,
    requestDetails,
    hasResolved,
    startFresh,
    seedPhase,
    setRequestDetails,
    shipToException,
  } = useConversation();
  const { submitRequest, addFieldException } = useRequests();
  const { addStepEntry } = useAssistantThread();
  const { ref: contentRef, overflowing } = useContentOverflow<HTMLDivElement>();
  const [shelfDockOpen, setShelfDockOpen] = useState(false);

  const approver = requestDetails?.approver ?? DEFAULT_APPROVER;
  const costCenter = requestDetails?.costCenter ?? DEFAULT_COST_CENTER;
  const approverName = approver.split(" · ")[0];
  // The request's own generated title, e.g. "15 laptops for Fusion Event
  // contractors" — the purpose line under the product name, never authored.
  const requestPurpose = getRequestDetail(REQUEST_ID)?.request;

  const total = items.reduce(
    (sum, i) => sum + activePrice(i, BASIS) * (quantities[i.id] ?? 0),
    0,
  );
  const savings = items.reduce(
    (sum, i) => sum + activeSavings(i, BASIS) * (quantities[i.id] ?? 0),
    0,
  );

  // /track has no route of its own to recover an in-progress request from —
  // an empty cart means this was reached directly (a deep link or a
  // reload), not by submitting through the flow. Seed the canonical catalog
  // scenario so the page still shows a real recap instead of an empty one;
  // the submission effect below picks it up once the cart update lands.
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
    // reload-only seed — never re-fires as the cart empties on exit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      ...(requestText == null ? {} : { prompt: requestText }),
      requester: "Marcus Webb",
      requesterPersonaId: "requester",
      supplier: items[0]?.vendor ?? "Lenovo",
      department: costCenter.split(" · ")[0],
      amount: formatPrice(total, "USD"),
      amountValue: total,
      status: "pending-approval",
      submitted: today,
      updated: today,
    });
    if (shipToException) {
      addFieldException(REQUEST_ID, {
        field: "Ship to",
        currentValue: requestDetails?.shipTo ?? DEFAULT_SHIP_TO,
        requestedValue: shipToException.requestedValue,
        reason: shipToException.reason,
        requester: "Marcus Webb",
        timestamp: today,
        ownerName: shipToException.ownerName,
      });
    }
    addStepEntry("done", `Submitted. With ${approverName} for approval.`, [
      `Request ${REQUEST_ID} submitted.`,
      `With ${approver} for approval.`,
      "You'll be notified when it's decided.",
    ]);
    // re-checked once the seed effect's cart update lands
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // Shared by the header's "New request" control and the footer's
  // secondary button — the reset itself happens once BuyFlow mounts fresh
  // at /buy.
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
            onCorrectionMade={() => {
              // No correction surface wired for this finish-line context yet.
            }}
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
              subtext={null}
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
                  You&apos;ll be notified when it&apos;s decided.
                </motion.p>

                {/* One card, one object (the request): reference number, the
                    product as the hero, the stage track, then cost and
                    routing as quiet metadata below a divider. */}
                {items.length > 0 && (
                  <motion.section
                    variants={fadeUpVariants(reduceMotion)}
                    className={cn(...GLASS_CLASSES, "mt-6 p-4 text-sm")}
                  >
                    <p className="text-xs text-muted-foreground">
                      Request {REQUEST_ID}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <BrandMark vendor={items[0].vendor} size="lg" />
                      <div className="min-w-0 flex-1">
                        {items.map((item) => (
                          <p
                            key={item.id}
                            className="truncate text-xl font-semibold tracking-tight text-foreground"
                          >
                            {quantities[item.id] ?? 0} × {item.name}
                          </p>
                        ))}
                        {requestPurpose != null && (
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {requestPurpose}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
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
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-medium text-foreground">
                          {formatPrice(total, "USD")}
                        </p>
                        {savings > 0 && (
                          <p className="mt-0.5 text-xs text-success">
                            EPP savings {formatPrice(savings, "USD")}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Charged to
                        </p>
                        <p className="font-medium text-foreground">
                          {costCenter}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Delivery
                        </p>
                        {/* PLACEHOLDER [Delivery date/location] — the
                            requester-side request model has no delivery
                            field (see data.ts); bracketed until one exists. */}
                        <p className="font-medium text-foreground">
                          [Delivery date] · [Delivery location]
                        </p>
                      </div>
                    </div>
                  </motion.section>
                )}
              </motion.div>
            </BuyScaffold>
          </div>

          {/* Both actions on the right, adjacent — Track request is the
              natural next step and stays primary; Start new request is
              secondary, to its left. No left-side action on this step. */}
          <FlowFooterBar
            bordered={overflowing}
            right={
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={startNewRequest}>
                  Start new request
                </Button>
                <Button
                  onClick={() => {
                    clear();
                    void navigate({
                      to: "/requests/$id",
                      params: { id: REQUEST_ID },
                    });
                  }}
                >
                  Track request
                </Button>
              </div>
            }
          />
        </div>
      </div>
    </motion.div>
  );
}
