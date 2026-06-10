"use client";

import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart-context";
import { useConversation } from "./conversation-context";
import { activePrice, activeSavings, formatPrice } from "./data";

// Catalog standard config prices under EPP.
const BASIS = "epp" as const;
const ACCENT = "bg-[#0f7b8a] text-white hover:bg-[#0c6976]";
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
        {/* Outcome — success cue + where it went and what's next. */}
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0f7b8a] text-white">
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
                  <span className="text-[#0f7b8a]">
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

        {/* One clear action; the request also lives on in My Requests. */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              clear();
              void navigate({ to: "/requests" });
            }}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            View all requests
          </button>
          <Button className={ACCENT} onClick={backToBuy}>
            Back to Buy
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
