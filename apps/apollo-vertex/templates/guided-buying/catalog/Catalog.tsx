"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useConversation } from "./v1/conversation-context";
import { CATALOG_VARIANTS } from "./variants";

/**
 * Catalog page host. Two states, switched on whether there's an active request:
 * Catalog nav (no request) → cold browse; "See all in catalog" after a request
 * (hasResolved) → the request-scoped view. Fades up into view on mount (paired
 * with the chat's exit transition on "See all").
 */
export function Catalog() {
  const { hasResolved } = useConversation();
  const reduceMotion = useReducedMotion();
  const ActiveVariant = CATALOG_VARIANTS[0].Component;

  return (
    <motion.div
      className="relative h-full"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Page fades in; the catalog items stagger their own fade-up (Selection). */}
      <ActiveVariant cold={!hasResolved} />
    </motion.div>
  );
}
