"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  InvoiceException,
  InvoiceReview,
  InvoiceRuntime,
} from "./invoice-review-data";

// Per-invoice loop state (resolved ids + surfaced exceptions), shared across the
// workspace, queue rail, and table so an invoice reads the same on every surface
// and updates live as the reviewer works the loop. No refetch simulation: it's
// one in-memory store keyed by invoice id.

const EMPTY: InvoiceRuntime = { resolvedIds: [], surfaced: [] };

interface RuntimeStore {
  getRuntime: (invoiceId: string) => InvoiceRuntime;
  resolveExceptions: (invoiceId: string, ids: string[]) => void;
  surfaceExceptions: (invoiceId: string, items: InvoiceException[]) => void;
  patchData: (invoiceId: string, patch: Partial<InvoiceReview>) => void;
}

const InvoiceRuntimeContext = createContext<RuntimeStore | null>(null);

export function InvoiceRuntimeProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, InvoiceRuntime>>({});

  const value = useMemo<RuntimeStore>(
    () => ({
      getRuntime: (id) => map[id] ?? EMPTY,
      resolveExceptions: (id, ids) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          const merged = Array.from(new Set([...cur.resolvedIds, ...ids]));
          if (merged.length === cur.resolvedIds.length) return prev;
          return { ...prev, [id]: { ...cur, resolvedIds: merged } };
        }),
      surfaceExceptions: (id, items) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          const existing = new Set(cur.surfaced.map((e) => e.id));
          const fresh = items.filter((e) => !existing.has(e.id));
          if (fresh.length === 0) return prev;
          return {
            ...prev,
            [id]: { ...cur, surfaced: [...cur.surfaced, ...fresh] },
          };
        }),
      patchData: (id, patch) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          return {
            ...prev,
            [id]: { ...cur, dataPatch: { ...cur.dataPatch, ...patch } },
          };
        }),
    }),
    [map],
  );

  return (
    <InvoiceRuntimeContext.Provider value={value}>
      {children}
    </InvoiceRuntimeContext.Provider>
  );
}

export function useInvoiceRuntime(): RuntimeStore {
  const ctx = useContext(InvoiceRuntimeContext);
  if (!ctx) {
    throw new Error(
      "useInvoiceRuntime must be used within an InvoiceRuntimeProvider",
    );
  }
  return ctx;
}
