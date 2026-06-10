"use client";

import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  FileText,
  Info,
  type LucideIcon,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversation } from "./conversation-context";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const STAGGER = 0.4;

interface BridgeField {
  icon: LucideIcon;
  label: string;
  value: string;
  source: string;
}

// Lighter than the catalog envelope — no ship-to / need-by, no editing.
const FIELDS: BridgeField[] = [
  {
    icon: Building2,
    label: "Cost center",
    value: "CC-4421",
    source: "From requester default",
  },
  {
    icon: FileText,
    label: "Agreement",
    value: "T-Mobile MSA",
    source: "Matched to carrier",
  },
];

interface ServiceBridgeProps {
  /** Open the configurator — BuyFlow slides the chat out before navigating. */
  onConfigure?: () => void;
}

/**
 * The Bridge beat for the contract (service) fork: restate the request, a light
 * inference set with provenance, and the routing line — then Continue opens the
 * configurator. Reuses the catalog Bridge's in-chat staggered reveal, tuned for
 * a service (fewer fields, no goods details, not editable).
 */
export function ServiceBridge({ onConfigure }: ServiceBridgeProps) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { requestText } = useConversation();

  const routingDelay = reduceMotion ? 0 : FIELDS.length * STAGGER;
  const ctaDelay = reduceMotion ? 0 : routingDelay + 0.25;

  return (
    <div className="w-full space-y-3">
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
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

      {/* Routing — the beat that reveals the fork. Icon + text indented to line
          up with the card's field rows (px-4, gap-3). */}
      <motion.div
        className="flex items-start gap-3 px-4 text-xs text-muted-foreground"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE, delay: routingDelay }}
      >
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          This is a service under your{" "}
          <span className="font-medium text-foreground">T-Mobile MSA</span>
          {", so I'll configure it and route it to procurement for approval."}
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
          onClick={() => {
            if (onConfigure) onConfigure();
            else void navigate({ to: "/configure" });
          }}
        >
          Configure with agent
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </motion.div>
    </div>
  );
}
