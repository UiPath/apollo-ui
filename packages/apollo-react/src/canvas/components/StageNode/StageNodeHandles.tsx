import { Position, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useMemo } from 'react';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';

const StageNodeHandlesInner = ({
  id,
  isReadOnly,
  selected,
  isHovered,
  isException,
}: {
  id: string;
  isReadOnly: boolean;
  selected: boolean;
  isHovered: boolean;
  isException?: boolean;
}) => {
  const isConnecting = useStore((state) => !!state.connectionClickStartHandle);
  const connectedHandleIds = useConnectedHandles(id);
  const hasConnections = connectedHandleIds.size > 0;
  const shouldShowHandles = useMemo(() => {
    return !isReadOnly && (selected || isHovered || isConnecting || hasConnections);
  }, [hasConnections, isConnecting, selected, isHovered, isReadOnly]);

  const handleConfigurations: HandleGroupManifest[] = useMemo(
    () =>
      isException
        ? []
        : [
            {
              position: Position.Left,
              handles: [
                {
                  id: `${id}____target____left`,
                  type: 'target',
                  handleType: 'input',
                },
              ],
              visible: selected || isHovered || isConnecting,
              customPositionAndOffsets: {
                top: 0,
                height: 64,
              },
            },
            {
              position: Position.Right,
              handles: [
                {
                  id: `${id}____source____right`,
                  type: 'source',
                  handleType: 'output',
                },
              ],
              visible: selected || isHovered || isConnecting,
              customPositionAndOffsets: {
                top: 0,
                height: 64,
              },
            },
            {
              position: Position.Bottom,
              handles: [
                {
                  id: `${id}____target____bottom`,
                  type: 'target',
                  handleType: 'input',
                },
              ],
              visible: selected || isHovered || isConnecting,
            },
            {
              position: Position.Bottom,
              handles: [
                {
                  id: `${id}____source____bottom`,
                  type: 'source',
                  handleType: 'output',
                },
              ],
              visible: selected || isHovered || isConnecting,
            },
          ],
    [isException, id, selected, isHovered, isConnecting]
  );

  const handleElements = useButtonHandles({
    handleConfigurations,
    shouldShowHandles,
    nodeId: id,
    selected,
  });

  return handleElements;
};

export const StageNodeHandles = memo(StageNodeHandlesInner);
