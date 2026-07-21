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
  type ArcState,
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
    (e, i) => ({ ...e, key: `event-${id}-${current.length + i}` }) as RunEvent,
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
      aiSourced?: boolean;
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
  /** Set (or clear with null) the transient aim state while hovering a mutating fix action. */
  setAimCorrection: (
    invoiceId: string,
    correction: DetailCorrections | null,
  ) => void;
  /**
   * Revert the most recent correctDetail call: restores detailCorrections to the
   * pre-correction snapshot stored in undoTarget, un-resolves the auto-resolved
   * exceptions, and appends the revert events. Cursor moves to the first re-opened
   * exception. No-op if no undoTarget exists.
   */
  revertDetail: (invoiceId: string, revertEvents: RunEventInput[]) => void;
  /**
   * Un-resolve a single exception committed via commitResolve. Removes it from
   * resolvedIds so it reappears in the open set. Used by the undo toast after an
   * attestation (verify) commits; the original resolved event stays in the log.
   */
  undoResolve: (invoiceId: string, excId: string) => void;
  /** Wipe all runtime state for every invoice and clear sessionStorage. Demo reset. */
  resetAllRuntimes: () => void;
  /** Read the transient arc animation state for an invoice (not persisted). */
  getArcState: (invoiceId: string) => ArcState | undefined;
  /** Set (or clear with null) the transient arc animation state for an invoice. */
  setArcState: (invoiceId: string, state: ArcState | null) => void;
  /**
   * Arc phase 1 (fires at ACT, t+450ms): commit the correction and one corrected
   * event; predicates run synchronously. Returns the computed cleared IDs and the
   * deferred auto-resolve + re-validated events — caller holds these and passes
   * them to correctDetailStep2 at REST so the center/queue stay frozen while the
   * panel pill is visible.
   */
  correctDetailStep1: (
    invoiceId: string,
    corrections: DetailCorrections,
    context: { openExceptions: InvoiceException[]; base: PredicateBaseData },
    correctionEvents: RunEventInput[],
    extras?: {
      dataPatch?: Partial<InvoiceReview>;
      surfaced?: InvoiceException[];
      settledSub?: string;
    },
  ) => {
    cleared: string[];
    autoResolveEvents: RunEventInput[];
    revalidatedEvent: RunEventInput;
  };
  /**
   * Arc phase 2 (fires at REST, t+1800ms): apply the auto-resolved exception IDs
   * and append the deferred auto-resolve and re-validated events from phase 1.
   * Queue chip, carousel, and timeline consequences become visible here.
   */
  correctDetailStep2: (
    invoiceId: string,
    cleared: string[],
    autoResolveEvents: RunEventInput[],
    revalidatedEvent: RunEventInput,
  ) => void;
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
  // Arc state is transient (drives the apply-arc animation) and is never persisted.
  const [arcStateMap, setArcStateMap] = useState<
    Record<string, ArcState | undefined>
  >({});

  const value = useMemo<RuntimeStore>(
    () => ({
      getRuntime: (id) => {
        const rt = map[id] ?? EMPTY;
        const arc = arcStateMap[id];
        return arc ? { ...rt, arcState: arc } : rt;
      },
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
            aiSourced: extras?.aiSourced,
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
              undoTarget: {
                prevDetailCorrections: cur.detailCorrections,
                autoResolvedIds: cleared,
              },
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
      setAimCorrection: (id, correction) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          if (!correction && !cur.aimCorrection) return prev;
          return {
            ...prev,
            [id]: { ...cur, aimCorrection: correction ?? undefined },
          };
        }),
      revertDetail: (id, revertEvents) => {
        // Peek at current state synchronously so we can update the cursor map too.
        const cur = map[id] ?? EMPTY;
        const target = cur.undoTarget;
        if (!target) return;
        setMap((prev) => {
          const c = prev[id] ?? EMPTY;
          if (!c.undoTarget) return prev;
          const { prevDetailCorrections, autoResolvedIds } = c.undoTarget;
          const autoIds = autoResolvedIds as string[];
          const newResolvedIds = c.resolvedIds.filter(
            (rid) => !autoIds.includes(rid),
          );
          const events = revertEvents.length
            ? [...c.events, ...withKeys(id, c.events, revertEvents)]
            : c.events;
          return {
            ...prev,
            [id]: {
              ...c,
              detailCorrections: prevDetailCorrections,
              resolvedIds: newResolvedIds,
              events,
              undoTarget: undefined,
              aimCorrection: undefined,
            },
          };
        });
        const firstReopened = target.autoResolvedIds[0];
        if (firstReopened) {
          setCursorMap((prev) => ({ ...prev, [id]: firstReopened }));
        }
      },
      undoResolve: (id, excId) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          if (!cur.resolvedIds.includes(excId)) return prev;
          return {
            ...prev,
            [id]: {
              ...cur,
              resolvedIds: cur.resolvedIds.filter((rid) => rid !== excId),
            },
          };
        }),
      correctDetailStep1: (
        id,
        corrections,
        context,
        correctionEvents,
        extras,
      ) => {
        // Read current state synchronously to run predicates before the setMap call.
        const cur = map[id] ?? EMPTY;
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
        const patchedScalars = Object.keys(corrections).filter(
          (k) => k !== "lines",
        );
        const patchedLineNums = Object.keys(corrections.lines ?? {}).map(
          Number,
        );
        setMap((prev) => {
          const c = prev[id] ?? EMPTY;
          const mergedC = mergeDetailCorrections(
            c.detailCorrections,
            corrections,
          );
          let surfaced = c.surfaced;
          if (extras?.surfaced?.length) {
            const existing = new Set(c.surfaced.map((e) => e.id));
            const fresh = extras.surfaced.filter((e) => !existing.has(e.id));
            if (fresh.length) surfaced = [...c.surfaced, ...fresh];
          }
          return {
            ...prev,
            [id]: {
              ...c,
              detailCorrections: mergedC,
              surfaced,
              dataPatch: extras?.dataPatch
                ? { ...c.dataPatch, ...extras.dataPatch }
                : c.dataPatch,
              events: [
                ...c.events,
                ...withKeys(id, c.events, correctionEvents),
              ],
              correctionPulse: {
                nonce: (c.correctionPulse?.nonce ?? 0) + 1,
                detailFields: patchedScalars,
                lineNums: patchedLineNums,
                autoResolvedIds: cleared,
                aiSourced: true,
              },
              undoTarget: {
                prevDetailCorrections: c.detailCorrections,
                autoResolvedIds: cleared,
              },
            },
          };
        });
        return { cleared, autoResolveEvents, revalidatedEvent };
      },
      correctDetailStep2: (id, cleared, autoResolveEvents, revalidatedEvent) =>
        setMap((prev) => {
          const cur = prev[id] ?? EMPTY;
          const newResolvedIds = cleared.length
            ? Array.from(new Set([...cur.resolvedIds, ...cleared]))
            : cur.resolvedIds;
          const allEvents: RunEventInput[] = [
            ...autoResolveEvents,
            revalidatedEvent,
          ];
          return {
            ...prev,
            [id]: {
              ...cur,
              resolvedIds: newResolvedIds,
              events: [...cur.events, ...withKeys(id, cur.events, allEvents)],
            },
          };
        }),
      resetAllRuntimes: () => {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {}
        setMap({});
        setCursorMap({});
        setArcStateMap({});
      },
      getArcState: (id) => arcStateMap[id],
      setArcState: (id, state) =>
        setArcStateMap((prev) => {
          const next = state ?? undefined;
          if (prev[id] === next) return prev;
          return { ...prev, [id]: next };
        }),
    }),
    [map, cursorMap, arcStateMap],
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
