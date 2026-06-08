"use client";

import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Pencil, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { AutopilotGradientIcon } from "@/registry/ai-chat/components/icons/autopilot-gradient";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-context";
import { CartLine } from "./CartLine";
import { CartSummary } from "./CartSummary";
import { APPROVAL_LIMIT, formatPrice, leadTime, SAMPLE_REQUEST } from "./data";

// Review commits the EPP-priced catalog scenario.
const BASIS = "epp" as const;

/** Review & submit — the commit surface for the catalog path. */
export function Review() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { items, quantities, setOpen } = useCart();
  const [agentOpen, setAgentOpen] = useState(false);

  const editCart = () => {
    setOpen(true);
    void navigate({ to: "/catalog" });
  };

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
      className="h-full overflow-y-auto"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-8">
        {/* Slim Autopilot presence — the agent stays with you through commit. */}
        <div className="flex items-center gap-2">
          <AutopilotGradientIcon size={18} aria-hidden="true" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Autopilot</span> ·
            I’ve prepared this for you — ready when you are.
          </span>
        </div>

        {/* Intent hero */}
        <header className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Review &amp; submit</p>
          <h1 className="text-2xl font-semibold leading-snug text-foreground">
            “{SAMPLE_REQUEST.summary}”
          </h1>
        </header>

        {/* Order summary (read-only) */}
        <section className="rounded-xl border bg-card p-4">
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
            />
          </div>
        </section>

        {/* Source & validation */}
        <section className="rounded-xl border p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            Source &amp; validation
          </h2>
          <p className="text-sm text-muted-foreground">
            {items[0].source} · {leadTime(items[0])} · EPP · validated today
          </p>
        </section>

        {/* Approval routing (in-limit happy path) */}
        <section className="flex items-center gap-2 rounded-xl border p-4 text-sm">
          <ShieldCheck
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="text-foreground">
            Within your {formatPrice(APPROVAL_LIMIT, "USD")} limit · no approval
            needed
          </span>
        </section>

        {/* Agent summary — one collapsed line, expandable */}
        <Collapsible open={agentOpen} onOpenChange={setAgentOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl border bg-muted/40 p-3 text-left text-sm text-muted-foreground"
            >
              <AutopilotIcon
                size={16}
                className="shrink-0 text-[#0f7b8a]"
                aria-hidden
              />
              <span className="flex-1 text-foreground">
                Here’s what I did to prepare this
              </span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  agentOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="space-y-1.5 px-3 py-3 text-sm text-muted-foreground">
              <li>· Sourced 12 catalog options matching your request</li>
              <li>· Applied EPP pricing across eligible items</li>
              <li>· Validated stock and price today</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={editCart}>
            Back
          </Button>
          <Button onClick={() => void navigate({ to: "/track" })}>
            Submit request
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
