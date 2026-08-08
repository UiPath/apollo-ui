import { useNodesData } from '@xyflow/react';
import type { Position } from '@xyflow/system';
import { useMemo } from 'react';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { resolveHandles } from '../../utils/manifest-resolver';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import type { HandleActionEvent, HandleMouseEvent } from '../ButtonHandle';
import { ButtonHandles } from '../ButtonHandle';

export const useButtonHandles = ({
  handleConfigurations,
  shouldShowHandles,
  handleAction,
  handleMouseEnter,
  handleMouseLeave,
  nodeId,
  selected,
  hovered,
  showAddButton,
  showNotches,
  shouldShowAddButtonFn,
  nodeWidth,
  nodeHeight,
  portalActions,
}: {
  handleConfigurations: HandleGroupManifest[];
  shouldShowHandles: boolean;
  nodeId: string;
  selected: boolean;
  hovered?: boolean;
  handleAction?: (event: HandleActionEvent) => void;
  handleMouseEnter?: (event: HandleMouseEvent) => void;
  handleMouseLeave?: (event: HandleMouseEvent) => void;
  showAddButton?: boolean;
  showNotches?: boolean;
  nodeWidth?: number;
  nodeHeight?: number;
  portalActions?: boolean;

  /**
   * Allows for consumers to control the predicate for showing the add button from the props that's passed in
   *
   * Defaults to:
   * ```ts
   * ({ showAddButton, selected, hovered }) => showAddButton && (selected || hovered)
   * ```
   */
  shouldShowAddButtonFn?: ({
    showAddButton,
    selected,
    hovered,
  }: {
    showAddButton: boolean;
    selected: boolean;
    hovered: boolean;
  }) => boolean;
}) => {
  const connectedHandleIds = useConnectedHandles(nodeId);
  const node = useNodesData(nodeId);

  const handleElements = useMemo(() => {
    if (
      !handleConfigurations ||
      !Array.isArray(handleConfigurations) ||
      handleConfigurations.length === 0
    )
      return <></>;

    const resolvedHandles = resolveHandles(handleConfigurations, node?.data ?? {});

    const elements = resolvedHandles.map((config, i) => {
      // alwaysVisible groups (e.g. marker handles) render regardless of the
      // hover / selection state, matching the LoopNode container behavior.
      const groupVisible =
        (shouldShowHandles || config.alwaysVisible === true) && (config.visible ?? true);

      const enhancedHandles = config.handles.map((handle) => ({
        ...handle,
        // Per-handle opacity: connected handles are always shown (opacity 1),
        // others follow the group hover/selection state.
        // `handle.visible` (config-level) is left untouched — it controls
        // whether the handle is rendered at all in ButtonHandlesBase.
        showHandle: connectedHandleIds.has(handle.id) || groupVisible,
        // Preserve individual handle's onAction if it exists, otherwise use global handleAction
        onAction: handle.onAction || handleAction,
        onMouseEnter: handle.onMouseEnter || handleMouseEnter,
        onMouseLeave: handle.onMouseLeave || handleMouseLeave,
      }));

      return (
        <ButtonHandles
          key={`${i}:${config.position}:${config.handles.map((h) => h.id).join(',')}`}
          nodeId={nodeId}
          handles={enhancedHandles}
          position={config.position as Position}
          selected={selected}
          hovered={hovered}
          showAddButton={showAddButton}
          showNotches={showNotches}
          customPositionAndOffsets={config.customPositionAndOffsets}
          shouldShowAddButtonFn={shouldShowAddButtonFn}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
          portalActions={portalActions}
        />
      );
    });

    return elements;
  }, [
    handleConfigurations,
    selected,
    hovered,
    shouldShowHandles,
    connectedHandleIds,
    handleAction,
    handleMouseEnter,
    handleMouseLeave,
    nodeId,
    showAddButton,
    showNotches,
    shouldShowAddButtonFn,
    nodeWidth,
    nodeHeight,
    portalActions,
    node?.data,
  ]);

  return handleElements;
};
