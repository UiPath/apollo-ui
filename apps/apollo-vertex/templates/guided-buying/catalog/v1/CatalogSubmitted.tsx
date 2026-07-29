"use client";

import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { JourneyBar } from "../../JourneyBar";
import { formatDateDisplay, getRequestDetail } from "../../requests/data";
import { useRequests } from "../../requests/requests-context";
import { useCart } from "./cart-context";
import { useConversation } from "./conversation-context";
import { activePrice, activeSavings, formatPrice } from "./data";
import { CATALOG_PHASES, FlowPhaseBar } from "./FlowPhaseBar";

// Catalog standard config prices under EPP.
const BASIS = "epp" as const;

const REQUEST_ID = "REQ-2052";

// Bridge defaults — used if Review is reached without a resolved Bridge.
const DEFAULT_APPROVER = "Alex Chen · Design Director";
const DEFAULT_COST_CENTER = "Design Operations · CC-4421";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
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
  const { requestDetails } = useConversation();
  const { submitRequest } = useRequests();

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
      request: cartDesc,
      requester: "Marcus Webb",
      supplier: items[0]?.vendor ?? "Lenovo",
      department: costCenter.split(" · ")[0],
      amount: formatPrice(total, "USD"),
      amountValue: total,
      status: "pending-approval",
      submitted: today,
      updated: today,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fire once on mount

  // The request is submitted — leaving empties the cart for the next one.
  const backToBuy = () => {
    clear();
    void navigate({ to: "/buy" });
  };

  return (
    <motion.div
      className="h-full overflow-y-auto"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-10">
        <FlowPhaseBar phases={CATALOG_PHASES} currentIndex={3} />

        {/* Outcome — success cue + where it went and what's next. */}
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-(--primary) text-white">
            <Check className="size-5" aria-hidden />
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Request submitted
            </h1>
            <p className="text-sm text-muted-foreground">
              {`It's with ${approverName} for approval. You'll be notified when it's decided.`}
            </p>
          </div>
        </div>

        {/* Recap — quiet, secondary to the hero; dynamic from cart + Bridge. */}
        {items.length > 0 && (
          <div className="rounded-xl border bg-muted/30 p-4 text-sm">
            <dl className="space-y-2.5">
              <Row label="Items">
                {items.map((item) => (
                  <div key={item.id}>
                    {quantities[item.id] ?? 0} × {item.name}
                  </div>
                ))}
              </Row>
              <Row label="Total">
                <span className="font-medium">{formatPrice(total, "USD")}</span>
                {savings > 0 && (
                  <span className="text-(--primary)">
                    {" "}
                    · EPP savings {formatPrice(savings, "USD")} applied
                  </span>
                )}
              </Row>
              <Row label="Charged to">{costCenter}</Row>
              <Row label="Routed to">{approver}</Row>
              <Row label="Request">{REQUEST_ID}</Row>
            </dl>
          </div>
        )}

        {/* Approval chain — what happens next after submission. */}
        <div className="rounded-xl border bg-card px-4 py-3.5">
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
        </div>

        {/* One clear action; the request also lives on in My Requests. */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              clear();
              void navigate({
                to: "/requests/$id",
                params: { id: REQUEST_ID },
              });
            }}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Track this request
          </button>
          <Button onClick={backToBuy}>Back to Buy</Button>
        </div>
      </div>
    </motion.div>
  );
}
