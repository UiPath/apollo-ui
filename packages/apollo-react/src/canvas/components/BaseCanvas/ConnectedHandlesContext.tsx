import { createContext, useContext, useRef, useSyncExternalStore, useCallback, useEffect, type ReactNode } from "react";
import type { Edge } from "@uipath/uix/xyflow/react";

type ConnectedHandlesMap = Map<string, Set<string>>;
type Listener = () => void;

const EMPTY_SET: ReadonlySet<string> = Object.freeze(new Set()) as ReadonlySet<string>;

/**
 * Store that manages connected handles with granular subscriptions.
 * Only notifies nodes whose connected handles actually changed.
 */
class ConnectedHandlesStore {
  private map: ConnectedHandlesMap = new Map();
  private listeners = new Map<string, Set<Listener>>();

  /**
   * Subscribe to changes for a specific node's connected handles.
   */
  subscribe(nodeId: string, listener: Listener): () => void {
    if (!this.listeners.has(nodeId)) {
      this.listeners.set(nodeId, new Set());
    }
    this.listeners.get(nodeId)!.add(listener);

    return () => {
      this.listeners.get(nodeId)?.delete(listener);
      if (this.listeners.get(nodeId)?.size === 0) {
        this.listeners.delete(nodeId);
      }
    };
  }

  /**
   * Get connected handles for a specific node.
   */
  getSnapshot(nodeId: string): ReadonlySet<string> {
    return this.map.get(nodeId) ?? EMPTY_SET;
  }

  /**
   * Update the store with new edges. Only notifies affected nodes.
   */
  update(edges: Edge[]): void {
    const newMap = buildConnectedHandlesMap(edges);
    const changedNodeIds = new Set<string>();

    // Find nodes whose connected handles changed
    for (const [nodeId, newHandles] of newMap) {
      const oldHandles = this.map.get(nodeId);
      if (!setsEqual(oldHandles, newHandles)) {
        changedNodeIds.add(nodeId);
      }
    }

    // Nodes removed entirely
    for (const nodeId of this.map.keys()) {
      if (!newMap.has(nodeId)) {
        changedNodeIds.add(nodeId);
      }
    }

    if (changedNodeIds.size === 0) {
      return;
    }

    this.map = newMap;

    // Notify only affected nodes
    for (const nodeId of changedNodeIds) {
      const nodeListeners = this.listeners.get(nodeId);
      if (nodeListeners) {
        for (const listener of nodeListeners) {
          listener();
        }
      }
    }
  }
}

/**
 * Compare two Sets for equality.
 */
function setsEqual(a: Set<string> | undefined, b: Set<string> | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

/**
 * Builds the connected handles map from edges.
 */
function buildConnectedHandlesMap(edges: Edge[]): ConnectedHandlesMap {
  const map: ConnectedHandlesMap = new Map();

  for (const edge of edges) {
    if (edge.sourceHandle) {
      if (!map.has(edge.source)) {
        map.set(edge.source, new Set());
      }
      map.get(edge.source)!.add(edge.sourceHandle);
    }

    if (edge.targetHandle) {
      if (!map.has(edge.target)) {
        map.set(edge.target, new Set());
      }
      map.get(edge.target)!.add(edge.targetHandle);
    }
  }

  return map;
}

const ConnectedHandlesContext = createContext<ConnectedHandlesStore | null>(null);

/**
 * Provides connected handles store to the tree.
 * Uses a subscription-based approach for granular updates - only nodes
 * whose connected handles actually change will re-render.
 */
export function ConnectedHandlesProvider({ edges, children }: { edges: Edge[]; children: ReactNode }) {
  const storeRef = useRef<ConnectedHandlesStore | null>(null);

  // Create store once
  if (!storeRef.current) {
    storeRef.current = new ConnectedHandlesStore();
  }

  useEffect(() => {
    storeRef.current!.update(edges);
  }, [edges]);

  return <ConnectedHandlesContext.Provider value={storeRef.current}>{children}</ConnectedHandlesContext.Provider>;
}

/**
 * Returns the set of connected handle IDs for a given node.
 * Uses useSyncExternalStore for efficient granular subscriptions -
 * only re-renders when this specific node's connected handles change.
 */
export function useConnectedHandles(nodeId: string): ReadonlySet<string> {
  const store = useContext(ConnectedHandlesContext);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!store) return () => {};
      return store.subscribe(nodeId, onStoreChange);
    },
    [store, nodeId]
  );

  const getSnapshot = useCallback(() => {
    if (!store) return EMPTY_SET;
    return store.getSnapshot(nodeId);
  }, [store, nodeId]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
