"use client";

import { type ReactNode, useState } from "react";
import { CartContext, type CartContextValue } from "./cart-context";
import { CATALOG_ITEMS } from "./data";

/**
 * Cart state, lifted above the in-memory router so both the catalog and the
 * Review page (separate routes) share one cart.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);

  const value: CartContextValue = {
    quantities,
    items: CATALOG_ITEMS.filter((item) => (quantities[item.id] ?? 0) > 0),
    count: Object.values(quantities).reduce((sum, qty) => sum + qty, 0),
    open,
    setOpen,
    inCart: (id) => Boolean(quantities[id]),
    // 0 = not in cart (avoids dynamic delete).
    toggle: (item) =>
      setQuantities((prev) => ({ ...prev, [item.id]: prev[item.id] ? 0 : 1 })),
    setQuantity: (item, quantity) =>
      setQuantities((prev) => ({ ...prev, [item.id]: quantity })),
    remove: (item) => setQuantities((prev) => ({ ...prev, [item.id]: 0 })),
    clear: () => setQuantities({}),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
