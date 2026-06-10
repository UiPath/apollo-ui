"use client";

import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Info,
  type LucideIcon,
  Quote,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRequests } from "../../requests/requests-context";
import { useConversation } from "./conversation-context";

// The RFQ lands in the buyer's Workbench and the requester's My Requests as one.
const SOURCING_REQUEST_ID = "REQ-2053";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const STAGGER = 0.4;

interface BridgeField {
  icon: LucideIcon;
  label: string;
  value: string;
  source: string;
}

// Services sourcing: no catalog SKU, no standing contract — it goes out for bids.
const FIELDS: BridgeField[] = [
  {
    icon: Building2,
    label: "Cost center",
    value: "Design Operations · CC-4421",
    source: "From your profile",
  },
  {
    icon: Users,
    label: "Engagement",
    value: "Contract design · 2 designers · ~Q3 (3 months)",
    source: "From your ask",
  },
  {
    icon: CircleDollarSign,
    label: "Budget guidance",
    value: "~$55k",
    source: "From your profile",
  },
];

/**
 * The Bridge beat for the sourcing (services) fork: restate the request, a light
 * inference set with provenance, and the routing line that reveals the fork —
 * no catalog match and no standing contract, so it goes out for bids. The CTA
 * sends the RFQ to procurement and lands the requester in its My Requests detail.
 */
export function ServicesBridge() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { requestText } = useConversation();
  const { openRequest } = useRequests();

  const sendToProcurement = () => {
    openRequest(SOURCING_REQUEST_ID);
    void navigate({ to: "/requests" });
  };

  const routingDelay = reduceMotion ? 0 : FIELDS.length * STAGGER;
  const ctaDelay = reduceMotion ? 0 : routingDelay + 0.25;

  return (
    <div className="w-full space-y-3">
      <div className={cn(GLASS_CLASSES, "divide-y overflow-hidden rounded-xl")}>
        {/* What the user asked for — the anchor (read-only, like the rest here). */}
        {requestText && (
          <motion.div
            className="flex items-center gap-3 px-4 py-2.5"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <Quote
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Request</p>
              <p className="text-sm font-medium text-foreground">
                {requestText}
              </p>
            </div>
            <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
              From you
            </span>
          </motion.div>
        )}
        {FIELDS.map((field, i) => {
          const Icon = field.icon;
          return (
            <motion.div
              key={field.label}
              className="flex items-center gap-3 px-4 py-2.5"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                ease: EASE,
                delay: reduceMotion ? 0 : i * STAGGER,
              }}
            >
              <Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="truncate text-sm font-medium text-foreground">
                  {field.value}
                </p>
              </div>
              <motion.span
                className="shrink-0 whitespace-nowrap text-xs text-muted-foreground"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.25,
                  delay: reduceMotion ? 0 : i * STAGGER + 0.18,
                }}
              >
                {field.source}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* Routing — the fork reveal: no SKU, no contract, so it goes out for bids.
          Icon + text indented to line up with the card's field rows. */}
      <motion.div
        className="flex items-start gap-3 px-4 text-xs text-muted-foreground"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE, delay: routingDelay }}
      >
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {
            "No catalog match and no standing contract, so I'll draft an RFQ and send it to procurement to source."
          }
        </span>
      </motion.div>

      <motion.div
        className="flex justify-end pt-2"
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE, delay: ctaDelay }}
      >
        <Button
          size="sm"
          className="bg-[#0f7b8a] text-white hover:bg-[#0c6976]"
          onClick={sendToProcurement}
        >
          Send to procurement
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </motion.div>
    </div>
  );
}
