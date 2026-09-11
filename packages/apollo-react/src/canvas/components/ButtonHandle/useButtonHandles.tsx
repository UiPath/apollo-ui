import { useNodesData } from '@xyflow/react';
import type { Position } from '@xyflow/system';
import { useMemo } from 'react';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { type ResolvedHandleGroup, resolveHandles } from '../../utils/manifest-resolver';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import type { HandleActionEvent, HandleMouseEvent } from '../ButtonHandle';
import { ButtonHandles } from '../ButtonHandle';

const EMPTY_DATA: Record<string, unknown> = {};

// Sentinel id for the pre-resolved path: hook order must not change, so
// useNodesData is still called, but pointing it at a never-existing id makes
// the subscription inert (a failed map lookup, a stable null result, and no
// re-render on any node-data change).
const NO_SUBSCRIPTION_NODE_ID = '__apollo_pre_resolved_no_subscription__';

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
  preResolved,
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
   * Set when `handleConfigurations` is already the output of `resolveHandles`
   * (templates replaced, repeats expanded, visibility booleans resolved).
   * Skips the hook's internal resolution pass and its node-data dependency,
   * so the same configuration is never resolved twice per render.
   */
  preResolved?: boolean;

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
  // Node data is only needed to resolve raw configurations; the pre-resolved
  // path swaps in the sentinel so it carries no live data subscription.
  const node = useNodesData(preResolved ? NO_SUBSCRIPTION_NODE_ID : nodeId);

  // When the input is pre-resolved, node data is not read for resolution; a
  // stable empty object keeps data changes from invalidating the memo below.
  const dataForResolution = preResolved ? EMPTY_DATA : (node?.data ?? EMPTY_DATA);

  const handleElements = useMemo(() => {
    if (
      !handleConfigurations ||
      !Array.isArray(handleConfigurations) ||
      handleConfigurations.length === 0
    )
      return <></>;

    const resolvedHandles = preResolved
      ? (handleConfigurations as unknown as ResolvedHandleGroup[])
      : resolveHandles(handleConfigurations, dataForResolution);

    const elements = resolvedHandles.map((config, i) => {
      const groupVisible = shouldShowHandles && (config.visible ?? true);

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
    dataForResolution,
    preResolved,
  ]);

  return handleElements;
};
