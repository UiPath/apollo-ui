"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  InvoiceDisposition,
  InvoiceException,
  InvoiceReview,
  InvoiceRuntime,
  RunEvent,
  RunEventInput,
  WaitingRef,
} from "./invoice-review-data";

// Per-invoice loop state, shared across the workspace, queue rail, and table so
// an invoice reads the same on every surface and updates live as the reviewer
// works the loop. The whole timeline event log lives here too, so history and
// disposition survive remounts (freeze/restore leans on that). One in-memory
// store keyed by invoice id.
//
// Re-entrancy rule: every action that changes state appends its event(s) in the
// SAME mutation (never from a view effect), so the append-only log can't
// double-fire or half-persist. Keys are `evt-${id}-${length + indexInBatch}` so
// batched appends stay unique.

const EMPTY: InvoiceRuntime = {
  resolvedIds: [],
  surfaced: [],
  waiting: [],
  events: [],
};

/** Stamp keys onto a batch of event inputs, continuing the log's index. */
function withKeys(
  id: string,
  current: RunEvent[],
  inputs: RunEventInput[],
): RunEvent[] {
  return inputs.map(
    (e, i) => ({ ...e, key: `evt-${id}-${current.length + i}` }) as RunEvent,
  );
}

/** A batch of loop state changes applied together with their events. */
interface ResolvePatch {
  /** exception ids to mark resolved */
  resolvedIds?: string[];
  /** new exceptions surfaced by a re-check */
  surfaced?: InvoiceException[];
  /** invoice-data changes (e.g. a linked PO) */
  dataPatch?: Partial<InvoiceReview>;
  /** parked exception ids to return to the open set (corrected invoice arrived) */
  unparkIds?: string[];
  /** events to append atomically with the above */
  events?: RunEventInput[];
}

interface RuntimeStore {
  getRuntime: (invoiceId: string) => InvoiceRuntime;
  /** Apply a batch of loop changes AND append their events in one update. */
  commitResolve: (invoiceId: string, patch: ResolvePatch) => void;
  /** Park an exception in a waiting state, appending the waiting row. */
  parkException: (
    invoiceId: string,
    ref: WaitingRef,
    event: RunEventInput,
  ) => void;
  /** Pure append: only for actions that change NO state (e.g. a follow-up). */
  appendEvents: (invoiceId: string, events: RunEventInput[]) => void;
  /** Set (or clear, with null) the disposition AND append its event atomically. */
  setDisposition: (
    invoiceId: string,
    disposition: InvoiceDisposition | null,
    event: RunEventInput,
  ) => void;
}

const InvoiceRuntimeContext = createContext<RuntimeStore | null>(null);

export function InvoiceRuntimeProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, InvoiceRuntime>>({});

  const value = useMemo<RuntimeStore>(
    () => ({
      getRuntime: (id) => map[id] ?? EMPTY,
      commitResolve: (id, patch) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          const resolvedIds = patch.resolvedIds?.length
            ? Array.from(new Set([...cur.resolvedIds, ...patch.resolvedIds]))
            : cur.resolvedIds;
          let surfaced = cur.surfaced;
          if (patch.surfaced?.length) {
            const existing = new Set(cur.surfaced.map((e) => e.id));
            const fresh = patch.surfaced.filter((e) => !existing.has(e.id));
            if (fresh.length) surfaced = [...cur.surfaced, ...fresh];
          }
          const waiting = patch.unparkIds?.length
            ? cur.waiting.filter((w) => !patch.unparkIds?.includes(w.id))
            : cur.waiting;
          const dataPatch = patch.dataPatch
            ? { ...cur.dataPatch, ...patch.dataPatch }
            : cur.dataPatch;
          const events = patch.events?.length
            ? [...cur.events, ...withKeys(id, cur.events, patch.events)]
            : cur.events;
          return {
            ...prev,
            [id]: { ...cur, resolvedIds, surfaced, waiting, dataPatch, events },
          };
        }),
      parkException: (id, ref, event) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          if (cur.waiting.some((w) => w.id === ref.id)) return prev;
          return {
            ...prev,
            [id]: {
              ...cur,
              waiting: [...cur.waiting, ref],
              events: [...cur.events, ...withKeys(id, cur.events, [event])],
            },
          };
        }),
      appendEvents: (id, events) =>
        setMap((prev) => {
          if (!events.length) return prev;
          const cur = prev[id] ?? EMPTY;
          return {
            ...prev,
            [id]: {
              ...cur,
              events: [...cur.events, ...withKeys(id, cur.events, events)],
            },
          };
        }),
      setDisposition: (id, disposition, event) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          return {
            ...prev,
            [id]: {
              ...cur,
              disposition: disposition ?? undefined,
              events: [...cur.events, ...withKeys(id, cur.events, [event])],
            },
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
