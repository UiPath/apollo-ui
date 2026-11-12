import { useStoreApi, useUpdateNodeInternals } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback } from 'react';

type StoreGetState = ReturnType<typeof useStoreApi>['getState'];

const pendingIdsByStore = new WeakMap<StoreGetState, Set<string>>();

/** `useUpdateNodeInternals`, but calls in the same task reach each React Flow store as one update. */
export function useBatchedUpdateNodeInternals(): (id: string) => void {
  const { getState } = useStoreApi();
  const updateNodeInternals = useUpdateNodeInternals();

  return useCallback(
    (id: string) => {
      const pendingIds = pendingIdsByStore.get(getState);
      if (pendingIds) {
        pendingIds.add(id);
        return;
      }
      const ids = new Set([id]);
      pendingIdsByStore.set(getState, ids);
      queueMicrotask(() => {
        pendingIdsByStore.delete(getState);
        updateNodeInternals([...ids]);
      });
    },
    [getState, updateNodeInternals]
  );
}
