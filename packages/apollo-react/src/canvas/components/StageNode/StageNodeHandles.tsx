import { Position, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useMemo } from 'react';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import type { HandleActionEvent, HandleMouseEvent } from '../ButtonHandle/ButtonHandle';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';
import { caseManagementStageManifest } from '../CaseFlow/case-flow.manifest';

/** Height of the stage header strip that left/right notches align to. */
const HANDLE_LANE_HEIGHT = 64;

const StageNodeHandlesInner = ({
  id,
  isReadOnly,
  selected,
  isHovered,
  isException,
  onHandleAction,
  onHandleMouseEnter,
  onHandleMouseLeave,
}: {
  id: string;
  isReadOnly: boolean;
  selected: boolean;
  isHovered: boolean;
  isException?: boolean;
  onHandleAction?: (event: HandleActionEvent) => void;
  onHandleMouseEnter?: (event: HandleMouseEvent) => void;
  onHandleMouseLeave?: (event: HandleMouseEvent) => void;
}) => {
  const isConnecting = useStore((state) => !!state.connectionClickStartHandle);
  const connectedHandleIds = useConnectedHandles(id);
  const hasConnections = connectedHandleIds.size > 0;
  const shouldShowHandles = useMemo(() => {
    return !isReadOnly && (selected || isHovered || isConnecting || hasConnections);
  }, [hasConnections, isConnecting, selected, isHovered, isReadOnly]);

  // Handle groups come straight from `caseManagementStageManifest` (ids included,
  // per the unified flow schema); the runtime contributes only hover visibility
  // and the header-aligned notch offsets. Edges must reference the manifest handle
  // ids (`input` / `next` / `reentry`); edges saved with the legacy instance-scoped
  // ids must be migrated to the manifest ids to keep rendering.
  const handleConfigurations: HandleGroupManifest[] = useMemo(() => {
    if (isException) return [];

    const visible = selected || isHovered || isConnecting;
    return (caseManagementStageManifest.handleConfiguration ?? []).map((group) => ({
      ...group,
      visible,
      customPositionAndOffsets:
        group.position === Position.Left || group.position === Position.Right
          ? { top: 0, height: HANDLE_LANE_HEIGHT }
          : undefined,
    }));
  }, [isException, selected, isHovered, isConnecting]);

  const handleElements = useButtonHandles({
    handleConfigurations,
    shouldShowHandles,
    nodeId: id,
    selected,
    hovered: isHovered,
    showAddButton: !isReadOnly,
    handleAction: onHandleAction,
    handleMouseEnter: onHandleMouseEnter,
    handleMouseLeave: onHandleMouseLeave,
  });

  return handleElements;
};

export const StageNodeHandles = memo(StageNodeHandlesInner);
