import type React from 'react';
import { createContext, useCallback, useContext, useRef, useSyncExternalStore } from 'react';

import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
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

  constructor(initialIds: ReadonlySet<string> = EMPTY_SET) {
    this.ids = initialIds.size === 0 ? EMPTY_SET : new Set(initialIds);
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

  isConnectionReadOnly(
    source: string | null | undefined,
    target: string | null | undefined
  ): boolean {
    return isConnectionReadOnly(this.ids, source, target);
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
 * True when both endpoints are read-only. Locking a node freezes the
 * connections wholly inside the locked region, not every connection it touches.
 */
export function isConnectionReadOnly(
  readOnlyNodeIds: ReadonlySet<string>,
  source: string | null | undefined,
  target: string | null | undefined
): boolean {
  if (readOnlyNodeIds.size === 0 || !source || !target) return false;
  return readOnlyNodeIds.has(source) && readOnlyNodeIds.has(target);
}

/**
 * Distributes per-node read-only state (from BaseCanvas `readOnlyNodeIds`) to
 * node renderers. Mounted by CanvasProviders; not intended for direct use.
 */
export const ReadOnlyNodesProvider: React.FC<
  React.PropsWithChildren<{ readOnlyNodeIds?: ReadonlySet<string> }>
> = ({ children, readOnlyNodeIds }) => {
  const storeRef = useRef<ReadOnlyNodesStore | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = new ReadOnlyNodesStore(readOnlyNodeIds);
  }

  // The constructor seeds the mount; this handles updates without notifying
  // subscribers during render. Layout timing, not `useEffect`: a passive effect
  // runs after paint, so subscribed nodes would paint once with the stale lock
  // state before flipping.
  useIsomorphicLayoutEffect(() => {
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

/**
 * True when the connection between these two nodes is frozen, i.e. both
 * endpoints are read-only. False outside a provider.
 */
export function useIsConnectionReadOnly(
  source: string | null | undefined,
  target: string | null | undefined
): boolean {
  const sourceReadOnly = useIsNodeReadOnly(source ?? '');
  const targetReadOnly = useIsNodeReadOnly(target ?? '');
  return !!source && !!target && sourceReadOnly && targetReadOnly;
}

/**
 * Returns a stable call-time check for event handlers and deferred work. Unlike
 * `useIsConnectionReadOnly`, this does not capture the value from a render.
 */
export function useReadOnlyConnectionCheck() {
  const store = useContext(ReadOnlyNodesContext);

  return useCallback(
    (source: string | null | undefined, target: string | null | undefined) =>
      store?.isConnectionReadOnly(source, target) ?? false,
    [store]
  );
}
