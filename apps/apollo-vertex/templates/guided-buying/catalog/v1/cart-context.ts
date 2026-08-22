"use client";

import { createContext, useContext } from "react";
import type { CatalogItem } from "./types";

export interface CartContextValue {
  /** item id → quantity (0 = not in cart). */
  quantities: Record<string, number>;
  /** Items currently in the cart, in catalog order. */
  items: CatalogItem[];
  /** Total units across the cart. */
  count: number;
  /** Whether the cart peek drawer is open. */
  open: boolean;
  setOpen: (open: boolean) => void;
  inCart: (id: string) => boolean;
  toggle: (item: CatalogItem) => void;
  setQuantity: (item: CatalogItem, quantity: number) => void;
  remove: (item: CatalogItem) => void;
  /** Empty the cart (e.g. after a request is submitted). */
  clear: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context == null) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
