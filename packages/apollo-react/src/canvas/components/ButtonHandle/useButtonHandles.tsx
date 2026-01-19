import { useNodesData } from '@xyflow/react';
import { Position } from '@xyflow/system';
import { useMemo } from 'react';
import { HandleGroupManifest } from '../../schema/node-definition';
import { resolveHandles } from '../../utils/manifest-resolver';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import type { HandleActionEvent } from '../ButtonHandle';
import { ButtonHandles } from '../ButtonHandle';

export const useButtonHandles = ({
  handleConfigurations,
  shouldShowHandles,
  handleAction,
  nodeId,
  selected,
  showAddButton,
  showNotches,
  shouldShowAddButtonFn,
  nodeWidth,
  nodeHeight,
  isExpandable,
}: {
  handleConfigurations: HandleGroupManifest[];
  shouldShowHandles: boolean;
  nodeId: string;
  selected: boolean;
  handleAction?: (event: HandleActionEvent) => void;
  showAddButton?: boolean;
  showNotches?: boolean;
  nodeWidth?: number;
  nodeHeight?: number;
  isExpandable?: boolean;

  /**
   * Allows for consumers to control the predicate for showing the add button from the props that's passed in
   *
   * Defaults to:
   * ```ts
   * ({ showAddButton, selected }) => showAddButton && selected
   * ```
   */
  shouldShowAddButtonFn?: ({
    showAddButton,
    selected,
  }: {
    showAddButton: boolean;
    selected: boolean;
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
      const hasConnectedHandle = config.handles.some((h) => connectedHandleIds.has(h.id));
      const finalVisible = hasConnectedHandle || (shouldShowHandles && (config.visible ?? true));

      // Enhance handles with the unified action handler
      const enhancedHandles = config.handles.map((handle) => ({
        ...handle,
        onAction: handleAction,
      }));

      return (
        <ButtonHandles
          key={`${i}:${config.position}:${config.handles.map((h) => h.id).join(',')}`}
          nodeId={nodeId}
          handles={enhancedHandles}
          position={config.position as Position}
          selected={selected}
          visible={finalVisible}
          showAddButton={showAddButton}
          showNotches={showNotches}
          customPositionAndOffsets={config.customPositionAndOffsets}
          shouldShowAddButtonFn={shouldShowAddButtonFn}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
          isExpandable={isExpandable}
        />
      );
    });

    return elements;
  }, [
    handleConfigurations,
    selected,
    shouldShowHandles,
    connectedHandleIds,
    handleAction,
    nodeId,
    showAddButton,
    showNotches,
    shouldShowAddButtonFn,
    nodeWidth,
    nodeHeight,
    isExpandable,
    node?.data,
  ]);

  return handleElements;
};
