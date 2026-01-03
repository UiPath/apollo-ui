import type { Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';

type ConnectedHandlesMap = Map<string, Set<string>>;
type Listener = () => void;

const EMPTY_SET: ReadonlySet<string> = Object.freeze(new Set()) as ReadonlySet<string>;

/**
 * Store that manages connected handles with granular subscriptions.
 * Guarantees snapshot identity stability for useSyncExternalStore.
 */
class ConnectedHandlesStore {
  private map: ConnectedHandlesMap = new Map();
  private listeners = new Map<string, Set<Listener>>();

  /**
   * Subscribe to changes for a specific node.
   */
  subscribe(nodeId: string, listener: Listener): () => void {
    let nodeListeners = this.listeners.get(nodeId);
    if (!nodeListeners) {
      nodeListeners = new Set();
      this.listeners.set(nodeId, nodeListeners);
    }

    nodeListeners.add(listener);

    return () => {
      nodeListeners!.delete(listener);
      if (nodeListeners!.size === 0) {
        this.listeners.delete(nodeId);
      }
    };
  }

  /**
   * Get connected handles for a specific node.
   * Snapshot identity is stable unless the node's handles actually change.
   */
  getSnapshot(nodeId: string): ReadonlySet<string> {
    return this.map.get(nodeId) ?? EMPTY_SET;
  }

  /**
   * Update store from edges.
   * Only replaces Set instances for nodes whose handles changed.
   */
  update(edges: Edge[]): void {
    const nextMap = buildConnectedHandlesMap(edges);
    const prevMap = this.map;

    const finalMap: ConnectedHandlesMap = new Map();
    const changedNodeIds = new Set<string>();

    // Added or updated nodes
    for (const [nodeId, nextSet] of nextMap) {
      const prevSet = prevMap.get(nodeId);

      if (setsEqual(prevSet, nextSet)) {
        // Reuse previous Set reference to preserve snapshot identity
        finalMap.set(nodeId, prevSet!);
      } else {
        finalMap.set(nodeId, nextSet);
        changedNodeIds.add(nodeId);
      }
    }

    // Removed nodes
    for (const nodeId of prevMap.keys()) {
      if (!nextMap.has(nodeId)) {
        changedNodeIds.add(nodeId);
      }
    }

    if (changedNodeIds.size === 0) {
      return;
    }

    this.map = finalMap;

    // Notify only affected subscribers
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
function setsEqual(a?: Set<string>, b?: Set<string>): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.size !== b.size) return false;

  for (const value of a) {
    if (!b.has(value)) return false;
  }

  return true;
}

/**
 * Build connected handles map from edges.
 */
function buildConnectedHandlesMap(edges: Edge[]): ConnectedHandlesMap {
  const map: ConnectedHandlesMap = new Map();

  for (const edge of edges) {
    if (edge.sourceHandle) {
      let set = map.get(edge.source);
      if (!set) {
        set = new Set();
        map.set(edge.source, set);
      }
      set.add(edge.sourceHandle);
    }

    if (edge.targetHandle) {
      let set = map.get(edge.target);
      if (!set) {
        set = new Set();
        map.set(edge.target, set);
      }
      set.add(edge.targetHandle);
    }
  }

  return map;
}

const ConnectedHandlesContext = createContext<ConnectedHandlesStore | null>(null);

/**
 * Provides the connected handles store to the tree.
 */
export function ConnectedHandlesProvider({
  edges,
  children,
}: {
  edges: Edge[];
  children: ReactNode;
}) {
  const storeRef = useRef<ConnectedHandlesStore | undefined>(undefined);

  if (!storeRef.current) {
    storeRef.current = new ConnectedHandlesStore();
  }

  useEffect(() => {
    storeRef.current!.update(edges);
  }, [edges]);

  return (
    <ConnectedHandlesContext.Provider value={storeRef.current}>
      {children}
    </ConnectedHandlesContext.Provider>
  );
}

/**
 * Hook to access connected handles for a specific node.
 * Only re-renders when that node's handles change.
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
    return store?.getSnapshot(nodeId) ?? EMPTY_SET;
  }, [store, nodeId]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
