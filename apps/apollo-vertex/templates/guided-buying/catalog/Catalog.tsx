"use client";

import { useEffect } from "react";
import { useConversation } from "./v1/conversation-context";
import { CATALOG_VARIANTS } from "./variants";

interface CatalogProps {
  /**
   * Seed the resolved thread on mount. True for direct /catalog entry (the rail
   * should already have context); false when hosted behind the Buy Intake hero,
   * which drives the resolve itself.
   */
  seedOnMount?: boolean;
}

/**
 * Catalog page host. Renders the default variant. The variant registry (and the
 * in-app switcher) is kept for future use — the switcher is just not shown now.
 */
export function Catalog({ seedOnMount = true }: CatalogProps) {
  const { hasResolved, resolveDefault } = useConversation();
  const ActiveVariant = CATALOG_VARIANTS[0].Component;

  // Seed the resolved thread for direct entry; the guard makes it run once
  // (resolveDefault flips hasResolved, so re-runs are no-ops).
  useEffect(() => {
    if (seedOnMount && !hasResolved) resolveDefault();
  }, [seedOnMount, hasResolved, resolveDefault]);

  return (
    <div className="relative h-full">
      <ActiveVariant />
    </div>
  );
}
