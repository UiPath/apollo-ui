import type {
  Connection,
  Edge,
  Node,
  ReactFlowProps,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback } from 'react';
import { useLatestRef } from '../../hooks/useLatestRef';
import { isConnectionReadOnly } from './ReadOnlyNodesContext';

type ConnectionEndpoints = Pick<Connection, 'source' | 'target'>;

type ConnectionCallbacks<EdgeType extends Edge> = Pick<
  ReactFlowProps<Node, EdgeType>,
  'isValidConnection' | 'onConnect' | 'onReconnect' | 'onReconnectEnd'
>;

type UseReadOnlyConnectionCallbacksOptions<EdgeType extends Edge> =
  ConnectionCallbacks<EdgeType> & {
    readOnlyNodeIds: ReadonlySet<string>;
  };

const includesReadOnlyConnection = (
  readOnlyNodeIds: ReadonlySet<string>,
  ...connections: ConnectionEndpoints[]
) =>
  connections.some(({ source, target }) => isConnectionReadOnly(readOnlyNodeIds, source, target));

export function useReadOnlyConnectionCallbacks<EdgeType extends Edge>({
  readOnlyNodeIds,
  isValidConnection,
  onConnect,
  onReconnect,
  onReconnectEnd,
}: UseReadOnlyConnectionCallbacksOptions<EdgeType>) {
  const readOnlyNodeIdsRef = useLatestRef(readOnlyNodeIds);
  const isValidConnectionRef = useLatestRef(isValidConnection);
  const onConnectRef = useLatestRef(onConnect);
  const onReconnectRef = useLatestRef(onReconnect);
  const onReconnectEndRef = useLatestRef(onReconnectEnd);

  // XYFlow captures these callbacks when a connection gesture starts. Keep the
  // wrappers stable and read the current lock set when the gesture validates or
  // completes, so a lock applied mid-gesture takes effect immediately.
  const guardedIsValidConnection = useCallback<NonNullable<typeof isValidConnection>>(
    (connection) => {
      const currentReadOnlyNodeIds = readOnlyNodeIdsRef.current;
      if (includesReadOnlyConnection(currentReadOnlyNodeIds, connection)) {
        return false;
      }
      return isValidConnectionRef.current?.(connection) ?? true;
    },
    [isValidConnectionRef, readOnlyNodeIdsRef]
  );

  const guardedOnConnect = useCallback<NonNullable<typeof onConnect>>(
    (connection) => {
      const currentOnConnect = onConnectRef.current;
      const currentReadOnlyNodeIds = readOnlyNodeIdsRef.current;
      if (!currentOnConnect || includesReadOnlyConnection(currentReadOnlyNodeIds, connection)) {
        return;
      }
      currentOnConnect(connection);
    },
    [onConnectRef, readOnlyNodeIdsRef]
  );

  const guardedOnReconnect = useCallback<NonNullable<typeof onReconnect>>(
    (edgeBeingReconnected, proposedConnection) => {
      const currentOnReconnect = onReconnectRef.current;
      const currentReadOnlyNodeIds = readOnlyNodeIdsRef.current;
      if (
        !currentOnReconnect ||
        includesReadOnlyConnection(currentReadOnlyNodeIds, edgeBeingReconnected, proposedConnection)
      ) {
        return;
      }
      currentOnReconnect(edgeBeingReconnected, proposedConnection);
    },
    [onReconnectRef, readOnlyNodeIdsRef]
  );

  // Checks only the original edge: the proposed target is already guarded above.
  const guardedOnReconnectEnd = useCallback<NonNullable<typeof onReconnectEnd>>(
    (event, edgeBeingReconnected, handleType, connectionState) => {
      const currentOnReconnectEnd = onReconnectEndRef.current;
      const currentReadOnlyNodeIds = readOnlyNodeIdsRef.current;
      if (
        !currentOnReconnectEnd ||
        includesReadOnlyConnection(currentReadOnlyNodeIds, edgeBeingReconnected)
      ) {
        return;
      }
      currentOnReconnectEnd(event, edgeBeingReconnected, handleType, connectionState);
    },
    [onReconnectEndRef, readOnlyNodeIdsRef]
  );

  return {
    guardedIsValidConnection,
    guardedOnConnect: onConnect ? guardedOnConnect : undefined,
    guardedOnReconnect: onReconnect ? guardedOnReconnect : undefined,
    guardedOnReconnectEnd: onReconnectEnd ? guardedOnReconnectEnd : undefined,
  };
}
