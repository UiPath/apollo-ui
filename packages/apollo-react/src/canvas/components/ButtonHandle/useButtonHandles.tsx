import { useMemo } from "react";
import { ButtonHandles } from "../ButtonHandle";
import type { HandleActionEvent } from "../ButtonHandle";
import type { HandleConfiguration } from "../BaseNode/BaseNode.types";
import type { Edge } from "@xyflow/react";

export const useButtonHandles = ({
  handleConfigurations,
  shouldShowHandles,
  handleAction,
  edges,
  nodeId,
  selected,
  showAddButton,
  showNotches,
  shouldShowAddButtonFn,
  nodeWidth,
  nodeHeight,
}: {
  handleConfigurations: HandleConfiguration[];
  shouldShowHandles: boolean;
  edges: Edge[];
  nodeId: string;
  selected: boolean;
  handleAction?: (event: HandleActionEvent) => void;
  showAddButton?: boolean;
  showNotches?: boolean;
  nodeWidth?: number;
  nodeHeight?: number;

  /**
   * Allows for consumers to control the predicate for showing the add button from the props that's passed in
   *
   * Defaults to:
   * ```ts
   * ({ showAddButton, selected }) => showAddButton && selected
   * ```
   */
  shouldShowAddButtonFn?: ({ showAddButton, selected }: { showAddButton: boolean; selected: boolean }) => boolean;
}) => {
  const connectedHandleIds = useMemo(() => {
    const ids = new Set<string>();
    if (!edges) return ids;
    for (const edge of edges) {
      if (edge.source === nodeId && edge.sourceHandle) ids.add(edge.sourceHandle);
      if (edge.target === nodeId && edge.targetHandle) ids.add(edge.targetHandle);
    }
    return ids;
  }, [edges, nodeId]);

  const handleElements = useMemo(() => {
    if (!handleConfigurations || !Array.isArray(handleConfigurations) || handleConfigurations.length === 0) return <></>;

    const elements = handleConfigurations.map((config, i) => {
      const hasConnectedHandle = config.handles.some((h) => connectedHandleIds.has(h.id));
      const finalVisible = hasConnectedHandle || (shouldShowHandles && (config.visible ?? true));

      // Enhance handles with the unified action handler
      const enhancedHandles = config.handles.map((handle) => ({
        ...handle,
        onAction: handle.onAction || handleAction,
      }));

      return (
        <ButtonHandles
          key={`${i}:${config.position}:${config.handles.map((h) => h.id).join(",")}`}
          nodeId={nodeId}
          handles={enhancedHandles}
          position={config.position}
          selected={selected}
          visible={finalVisible}
          showAddButton={showAddButton}
          showNotches={showNotches}
          customPositionAndOffsets={config.customPositionAndOffsets}
          shouldShowAddButtonFn={shouldShowAddButtonFn}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
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
  ]);

  return handleElements;
};
