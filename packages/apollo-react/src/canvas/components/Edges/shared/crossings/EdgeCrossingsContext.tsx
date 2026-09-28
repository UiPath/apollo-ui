import { createContext, type ReactNode, useContext, useRef } from 'react';
import type { PathJump, Point } from '../types';
import { computeLineJumps, type EdgePolyline, jumpsEqual, polylinesEqual } from './crossings';

type Listener = () => void;

export const EMPTY_JUMPS: readonly PathJump[] = Object.freeze([]);

/**
 * Registry of edge polylines with granular per-edge subscriptions, mirroring
 * `ConnectedHandlesStore`. Edges publish their vertices, the store derives every
 * crossing once, and each edge reads back only its own jumps.
 *
 * Jumps are derived from the vertices and change only the SVG `d` string the
 * edge draws, never the vertices themselves, so publishing can't re-trigger the
 * computation that produced it.
 */
export class EdgeCrossingsStore {
  private geometry = new Map<string, Point[]>();
  private jumps = new Map<string, readonly PathJump[]>();
  private listeners = new Map<string, Set<Listener>>();
  private scheduled = false;

  /**
   * Publish (or replace) one edge's polyline.
   *
   * A registration that repeats the stored positions is dropped rather than
   * scheduling a recompute. Callers hand over a fresh array on every render
   * whose geometry inputs changed identity but not value: `useNodeDragRebalance`
   * rebuilds its waypoint list on each render while a drag is active, so the
   * re-render this store triggers would otherwise schedule a second whole-graph
   * pass that can only reproduce the jumps it just published.
   *
   * The stored array is kept and the incoming one dropped, so the retained
   * baseline is never more than one tolerance behind the rendered path: a
   * polyline creeping below the threshold each frame still trips the comparison
   * once its total drift from the baseline exceeds it.
   */
  register(edgeId: string, points: Point[]): void {
    const current = this.geometry.get(edgeId);
    if (current && polylinesEqual(current, points)) return;

    this.geometry.set(edgeId, points);
    this.schedule();
  }

  /** Withdraw an edge — unmounted, or line jumps switched off. */
  unregister(edgeId: string): void {
    if (this.geometry.delete(edgeId)) this.schedule();
  }

  subscribe(edgeId: string, listener: Listener): () => void {
    let edgeListeners = this.listeners.get(edgeId);
    if (!edgeListeners) {
      edgeListeners = new Set();
      this.listeners.set(edgeId, edgeListeners);
    }

    edgeListeners.add(listener);

    return () => {
      edgeListeners.delete(listener);
      if (edgeListeners.size === 0) this.listeners.delete(edgeId);
    };
  }

  /**
   * Jumps for one edge. The identity is stable until that edge's own jumps
   * change, so it can drive a `useMemo` without invalidating it every frame.
   */
  getSnapshot(edgeId: string): readonly PathJump[] {
    return this.jumps.get(edgeId) ?? EMPTY_JUMPS;
  }

  /**
   * Coalesce the registrations from one commit into a single pass.
   *
   * Edges register in a layout effect, so the microtask drains before the
   * browser paints and a drag keeps its arcs in step with the stroke. The
   * opening commit is the exception: `useSyncExternalStore` subscribes in a
   * passive effect, which the scheduler runs a macrotask later, so this first
   * pass has nobody to notify. React's own check after subscribing picks the
   * jumps up, one commit behind.
   */
  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      this.recompute();
    });
  }

  private recompute(): void {
    const polylines: EdgePolyline[] = [];
    for (const [edgeId, points] of this.geometry) polylines.push({ edgeId, points });

    const next = computeLineJumps(polylines);
    const changed: string[] = [];

    for (const [edgeId, jumps] of next) {
      if (jumpsEqual(this.jumps.get(edgeId) ?? EMPTY_JUMPS, jumps)) continue;
      this.jumps.set(edgeId, jumps);
      changed.push(edgeId);
    }

    for (const edgeId of [...this.jumps.keys()]) {
      if (next.has(edgeId)) continue;
      this.jumps.delete(edgeId);
      changed.push(edgeId);
    }

    // Notify only the edges whose own notches moved — a crossing forming on the
    // far side of the canvas must not re-render every edge.
    for (const edgeId of changed) {
      const edgeListeners = this.listeners.get(edgeId);
      if (!edgeListeners) continue;
      for (const listener of edgeListeners) listener();
    }
  }
}

const EdgeCrossingsContext = createContext<EdgeCrossingsStore | null>(null);

/**
 * Provides the crossings store to the tree. `BaseCanvas` mounts one already; a
 * canvas assembled by hand needs this above its edges, or the flag is inert and
 * every crossing draws flat.
 *
 * An ancestor store wins over a fresh one, so wrapping a `BaseCanvas` in this
 * (or double-wrapping by accident) is a no-op rather than a trap. Two stores in
 * one canvas would split the registry down the middle: edges on either side of
 * the boundary would stop seeing each other, and the only symptom would be
 * crossings that quietly refuse to hop.
 */
export function EdgeCrossingsProvider({ children }: { children: ReactNode }) {
  const inherited = useContext(EdgeCrossingsContext);
  const ownStoreRef = useRef<EdgeCrossingsStore | undefined>(undefined);

  if (!ownStoreRef.current) {
    ownStoreRef.current = new EdgeCrossingsStore();
  }

  return (
    <EdgeCrossingsContext.Provider value={inherited ?? ownStoreRef.current}>
      {children}
    </EdgeCrossingsContext.Provider>
  );
}

export function useEdgeCrossingsStore(): EdgeCrossingsStore | null {
  return useContext(EdgeCrossingsContext);
}
