import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';

import { EMPTY_SET, setsEqual } from './set-utils';

type Listener = () => void;

/**
 * Store for per-node read-only state with granular subscriptions.
 *
 * Each node subscribes under its own id, so locking one node only notifies that
 * node. Mirrors ConnectedHandlesStore.
 */
class ReadOnlyNodesStore {
  private ids: ReadonlySet<string>;
  private listeners = new Map<string, Set<Listener>>();

  constructor(initial: ReadonlySet<string> = EMPTY_SET) {
    this.ids = initial.size === 0 ? EMPTY_SET : new Set(initial);
  }

  /** Subscribe to changes for a specific node. */
  subscribe(nodeId: string, listener: Listener): () => void {
    let nodeListeners = this.listeners.get(nodeId);
    if (!nodeListeners) {
      nodeListeners = new Set();
      this.listeners.set(nodeId, nodeListeners);
    }
    nodeListeners.add(listener);

    return () => {
      nodeListeners.delete(listener);
      if (nodeListeners.size === 0) {
        this.listeners.delete(nodeId);
      }
    };
  }

  /** Boolean snapshots let React bail out when a node's state is unchanged. */
  isReadOnly(nodeId: string): boolean {
    return this.ids.has(nodeId);
  }

  /**
   * Replace the locked set, notifying only the nodes whose state flipped.
   * Stores a copy so in-place mutation of the caller's Set is detected.
   */
  update(next: ReadonlySet<string>): void {
    const prev = this.ids;
    if (setsEqual(prev, next)) return;

    const changedNodeIds = new Set<string>();
    for (const id of next) {
      if (!prev.has(id)) changedNodeIds.add(id);
    }
    for (const id of prev) {
      if (!next.has(id)) changedNodeIds.add(id);
    }

    this.ids = next.size === 0 ? EMPTY_SET : new Set(next);

    for (const nodeId of changedNodeIds) {
      const nodeListeners = this.listeners.get(nodeId);
      if (nodeListeners) {
        for (const listener of nodeListeners) listener();
      }
    }
  }
}

const ReadOnlyNodesContext = createContext<ReadOnlyNodesStore | null>(null);

/**
 * Returns a reference-stable id set, preserving the previous reference when
 * contents are unchanged.
 *
 * Copies the input so in-place mutation (`ids.add('x')`) is detected;
 * `ReadonlySet` is only a compile-time guarantee.
 *
 * Accepts a set or an array and normalizes here, so every downstream consumer
 * sees a real set. A plain array would otherwise pass through `setsEqual`,
 * whose `size` comparison is `n !== undefined` on an array: always unequal, so
 * the hook would hand back a fresh set every render and lose the exact
 * stability it exists to provide. TypeScript cannot catch that for a JS
 * consumer.
 */
export function useStableNodeIdSet(
  ids: ReadonlySet<string> | readonly string[] | undefined
): ReadonlySet<string> {
  const ref = useRef<ReadonlySet<string>>(EMPTY_SET);
  // Only copy when the input is not already a set; the documented set path
  // keeps its previous zero-allocation behavior.
  const next = ids === undefined ? EMPTY_SET : ids instanceof Set ? ids : new Set(ids);
  if (!setsEqual(ref.current, next)) {
    ref.current = next.size === 0 ? EMPTY_SET : new Set(next);
  }
  return ref.current;
}

/**
 * Distributes BaseCanvas `readOnlyNodeIds` to node renderers.
 * Mounted by CanvasProviders; not intended for direct use.
 */
export const ReadOnlyNodesProvider: React.FC<
  React.PropsWithChildren<{ readOnlyNodeIds?: ReadonlySet<string> }>
> = ({ children, readOnlyNodeIds }) => {
  const storeRef = useRef<ReadOnlyNodesStore | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = new ReadOnlyNodesStore(readOnlyNodeIds);
  }

  // The constructor seeds the mount; the effect handles updates without
  // notifying subscribers during render. Enforcement is applied to node and
  // edge objects in the same render.
  useEffect(() => {
    storeRef.current?.update(readOnlyNodeIds ?? EMPTY_SET);
  }, [readOnlyNodeIds]);

  return (
    <ReadOnlyNodesContext.Provider value={storeRef.current}>
      {children}
    </ReadOnlyNodesContext.Provider>
  );
};

/**
 * True when this node is marked read-only by BaseCanvas `readOnlyNodeIds`.
 * Re-renders only when this node's own state changes.
 * Returns false outside a provider so nodes render safely in isolation.
 */
export function useIsNodeReadOnly(nodeId: string): boolean {
  const store = useContext(ReadOnlyNodesContext);

  const subscribe = useCallback(
    (onStoreChange: Listener) => store?.subscribe(nodeId, onStoreChange) ?? (() => {}),
    [store, nodeId]
  );
  const getSnapshot = useCallback(() => store?.isReadOnly(nodeId) ?? false, [store, nodeId]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
