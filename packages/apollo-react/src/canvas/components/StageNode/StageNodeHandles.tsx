import { Position, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useMemo } from 'react';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { resolveNodeHandleAffordances, selectIsConnecting } from '../../utils/NodeUtils';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useSelectionState } from '../BaseCanvas/SelectionStateContext';
import type { HandleActionEvent, HandleMouseEvent } from '../ButtonHandle';
import { HANDLE_CROSS_AXIS_SIZE_PX } from '../ButtonHandle/ButtonHandleStyleUtils';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';

const StageNodeHandlesInner = ({
  id,
  isReadOnly,
  selected,
  isHovered,
  isException,
  dragging,
  onHandleAction,
  onHandleMouseEnter,
  onHandleMouseLeave,
  handleAddButtonTitle,
}: {
  id: string;
  isReadOnly: boolean;
  selected: boolean;
  isHovered: boolean;
  isException?: boolean;
  dragging?: boolean;
  onHandleAction?: (event: HandleActionEvent) => void;
  onHandleMouseEnter?: (event: HandleMouseEvent) => void;
  onHandleMouseLeave?: (event: HandleMouseEvent) => void;
  handleAddButtonTitle?: string;
}) => {
  const isConnecting = useStore(selectIsConnecting);
  const { multipleNodesSelected } = useSelectionState();
  const { showAddButton } = resolveNodeHandleAffordances({
    isConnecting,
    selected,
    hovered: isHovered,
    dragging,
    canEdit: !isReadOnly,
    multipleNodesSelected,
  });
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
              customPositionAndOffsets: {
                width: HANDLE_CROSS_AXIS_SIZE_PX,
              },
            },
            {
              position: Position.Bottom,
              handles: [
                {
                  id: `${id}____source____bottom`,
                  type: 'source',
                  handleType: 'output',
                  // Only the right handle adds the next stage; this one re-enters.
                  showButton: false,
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
    hovered: isHovered,
    handleAction: onHandleAction,
    handleMouseEnter: onHandleMouseEnter,
    handleMouseLeave: onHandleMouseLeave,
    showAddButton,
    isLocked: isReadOnly,
    addButtonTitle: handleAddButtonTitle,
  });

  return handleElements;
};

export const StageNodeHandles = memo(StageNodeHandlesInner);
