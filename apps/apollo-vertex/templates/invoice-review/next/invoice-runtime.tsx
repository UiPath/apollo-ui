"use client";

import {
  createContext,
  useEffect,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  exceptionMeta,
  runPredicates,
  type DetailCorrections,
  type InvoiceDisposition,
  type InvoiceException,
  type InvoiceReview,
  type InvoiceRuntime,
  type PredicateBaseData,
  type RunEvent,
  type RunEventInput,
  type WaitingRef,
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
  /** corrections to the extracted detail record (panel fields + line items) */
  detailCorrections?: DetailCorrections;
  /** parked exception ids to return to the open set (corrected invoice arrived) */
  unparkIds?: string[];
  /** events to append atomically with the above */
  events?: RunEventInput[];
}

function mergeDetailCorrections(
  cur: DetailCorrections | undefined,
  patch: DetailCorrections,
): DetailCorrections {
  return {
    ...cur,
    ...patch,
    lines: { ...(cur?.lines ?? {}), ...(patch.lines ?? {}) },
  };
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
  /**
   * Apply human-authored corrections to the extracted detail record, run the
   * predicate registry against open exceptions, and auto-resolve any whose
   * condition is now satisfied — all in one atomic store update. The caller
   * supplies the current open exceptions and base data; the store owns all logic.
   * `extras` extends the mutation with surfaced exceptions and data patches so
   * fix-action paths can route entirely through this mutation.
   */
  correctDetail: (
    invoiceId: string,
    corrections: DetailCorrections,
    context: { openExceptions: InvoiceException[]; base: PredicateBaseData },
    correctionEvents: RunEventInput[],
    extras?: {
      surfaced?: InvoiceException[];
      dataPatch?: Partial<InvoiceReview>;
      settledSub?: string;
    },
  ) => void;
  /**
   * Request a source-document highlight for an exception's anchors. Bumps a
   * nonce each call so a repeat request re-scrolls/re-pulses. Pure navigation:
   * changes no loop state and logs no event.
   */
  showInSource: (
    invoiceId: string,
    exceptionId: string,
    anchors: string[],
  ) => void;
  /**
   * Set (or clear with null) the field-focus highlight from the edit form.
   * Pure navigation: bumps a nonce for re-scroll/re-pulse, no loop state change.
   */
  setFieldHighlight: (invoiceId: string, anchor: string | null) => void;
  /** Read the cursor exception id for an invoice (the active row in ExceptionTimeline). */
  getCursor: (invoiceId: string) => string | undefined;
  /** Set the cursor exception id (called by ExceptionTimeline on active change). */
  setCursor: (invoiceId: string, exceptionId: string | undefined) => void;
}

const InvoiceRuntimeContext = createContext<RuntimeStore | null>(null);

const STORAGE_KEY = "apollo-vertex-invoice-runtime";

function loadFromStorage(): Record<string, InvoiceRuntime> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, InvoiceRuntime>;
  } catch {}
  return {};
}

export function InvoiceRuntimeProvider({ children }: { children: ReactNode }) {
  const [map, setMap] =
    useState<Record<string, InvoiceRuntime>>(loadFromStorage);

  // Persist every map update so corrections survive a page reload.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {}
  }, [map]);
  const [cursorMap, setCursorMap] = useState<Record<string, string>>({});

  const value = useMemo<RuntimeStore>(
    () => ({
      getRuntime: (id) => map[id] ?? EMPTY,
      getCursor: (id) => cursorMap[id],
      setCursor: (id, exceptionId) =>
        setCursorMap((prev) => {
          const next = exceptionId ?? "";
          if (prev[id] === next) return prev;
          return { ...prev, [id]: next };
        }),
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
          const detailCorrections = patch.detailCorrections
            ? mergeDetailCorrections(
                cur.detailCorrections,
                patch.detailCorrections,
              )
            : cur.detailCorrections;
          const events = patch.events?.length
            ? [...cur.events, ...withKeys(id, cur.events, patch.events)]
            : cur.events;
          return {
            ...prev,
            [id]: {
              ...cur,
              resolvedIds,
              surfaced,
              waiting,
              dataPatch,
              detailCorrections,
              events,
            },
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
      correctDetail: (id, corrections, context, correctionEvents, extras) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          const merged = mergeDetailCorrections(
            cur.detailCorrections,
            corrections,
          );
          const { cleared } = runPredicates(
            context.openExceptions,
            merged,
            context.base,
          );
          const autoResolveEvents: RunEventInput[] = cleared.map((cid) => {
            const exc = context.openExceptions.find((e) => e.id === cid);
            return {
              kind: "resolved",
              label: `${exc ? exceptionMeta(exc).label : "Issue"} cleared`,
              sub: "Cleared automatically after correction",
              time: "Just now",
              auto: true,
              exception: exc,
            };
          });
          const settledSub =
            extras?.settledSub ??
            (cleared.length > 0
              ? `All checks re-run, ${cleared.length} issue${cleared.length > 1 ? "s" : ""} cleared`
              : "All checks re-run, nothing new");
          const revalidatedEvent: RunEventInput = {
            kind: "revalidated",
            label: "Re-validated",
            sub: settledSub,
            time: "Just now",
            pending: false,
          };
          const allEvents: RunEventInput[] = [
            ...correctionEvents,
            ...autoResolveEvents,
            revalidatedEvent,
          ];
          const newResolvedIds = cleared.length
            ? Array.from(new Set([...cur.resolvedIds, ...cleared]))
            : cur.resolvedIds;
          // Merge surfaced exceptions from the re-check (fix-action path).
          let surfaced = cur.surfaced;
          if (extras?.surfaced?.length) {
            const existing = new Set(cur.surfaced.map((e) => e.id));
            const fresh = extras.surfaced.filter((e) => !existing.has(e.id));
            if (fresh.length) surfaced = [...cur.surfaced, ...fresh];
          }
          const dataPatch = extras?.dataPatch
            ? { ...cur.dataPatch, ...extras.dataPatch }
            : cur.dataPatch;
          const patchedScalars = Object.keys(corrections).filter(
            (k) => k !== "lines",
          );
          const patchedLineNums = Object.keys(corrections.lines ?? {}).map(
            Number,
          );
          const newPulse = {
            nonce: (cur.correctionPulse?.nonce ?? 0) + 1,
            detailFields: patchedScalars,
            lineNums: patchedLineNums,
            autoResolvedIds: cleared,
          };
          return {
            ...prev,
            [id]: {
              ...cur,
              detailCorrections: merged,
              resolvedIds: newResolvedIds,
              surfaced,
              dataPatch,
              events: [...cur.events, ...withKeys(id, cur.events, allEvents)],
              correctionPulse: newPulse,
            },
          };
        }),
      showInSource: (id, exceptionId, anchors) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          return {
            ...prev,
            [id]: {
              ...cur,
              highlight: {
                anchors,
                exceptionId,
                nonce: (cur.highlight?.nonce ?? 0) + 1,
              },
            },
          };
        }),
      setFieldHighlight: (id, anchor) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          const next = anchor
            ? { anchor, nonce: (cur.fieldHighlight?.nonce ?? 0) + 1 }
            : undefined;
          if (!anchor && !cur.fieldHighlight) return prev;
          return { ...prev, [id]: { ...cur, fieldHighlight: next } };
        }),
    }),
    [map, cursorMap],
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
