import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo } from 'react';
import { useNodeTypeRegistry } from '../../core';
import {
  useElementValidationStatus,
  useNodeExecutionState,
  useToolbarActionStoreContext,
} from '../../hooks';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { resolveAdornments } from '../../utils/adornment-resolver';
import { getIcon } from '../../utils/icon-registry';
import { resolveDisplay, resolveHandles } from '../../utils/manifest-resolver';
import { selectIsConnecting } from '../../utils/NodeUtils';
import { resolveToolbar } from '../../utils/toolbar-resolver';
import { useBaseCanvasMode } from '../BaseCanvas/BaseCanvasModeProvider';
import { useCanvasTheme } from '../BaseCanvas/CanvasThemeContext';
import { useIsNodeReadOnly } from '../BaseCanvas/ReadOnlyNodesContext';
import { useSelectionState } from '../BaseCanvas/SelectionStateContext';
import { InitialsBadge } from '../shared/InitialsBadge';
import type { NodeToolbarConfig } from '../Toolbar';
import { hideToolbarActions, lockToolbarConfig } from '../Toolbar/NodeToolbar/NodeToolbar.utils';
import type { BaseNodeData, NodeAdornments, NodeStatusContext } from './BaseNode.types';
import { useBaseNodeOverrideConfig } from './BaseNodeConfigContext';

type PresentationNodeProps = Pick<
  NodeProps<Node<BaseNodeData>>,
  'data' | 'dragging' | 'id' | 'selected' | 'type'
>;

/**
 * Manifest-backed presentation model shared by the card and sequential bar
 * renderers, so both resolve identical display, icon, handles, toolbar, and status.
 */
export function useBaseNodePresentation({
  type,
  data,
  selected,
  id,
  dragging,
}: PresentationNodeProps) {
  const overrideConfig = useBaseNodeOverrideConfig();
  const {
    executionStatusOverride,
    handleConfigurations: handleConfigurationsOverride,
    toolbarConfig: toolbarConfigOverride,
    hiddenToolbarActionIds,
    adornments: adornmentsOverride,
    iconComponent,
    suggestionType: suggestionTypeOverride,
  } = overrideConfig;
  // A `null` override suppresses styling; otherwise the override wins over `data.suggestionType`.
  const suggestionType =
    suggestionTypeOverride === null ? undefined : (suggestionTypeOverride ?? data.suggestionType);
  const executionState = useNodeExecutionState(id);
  const validationState = useElementValidationStatus(id);
  const nodeTypeRegistry = useNodeTypeRegistry();
  const { mode } = useBaseCanvasMode();
  const isNodeReadOnly = useIsNodeReadOnly(id);
  const canEdit = mode === 'design' && !isNodeReadOnly;
  const isConnecting = useStore(selectIsConnecting);
  const { multipleNodesSelected } = useSelectionState();
  const { isDarkMode } = useCanvasTheme();
  const { updateNodeData } = useReactFlow();
  // This node's own canvas store, so side-by-side canvases keep separate toolbars.
  const toolbarActionStore = useToolbarActionStoreContext();

  const manifest = useMemo(() => nodeTypeRegistry.getManifest(type), [type, nodeTypeRegistry]);
  const statusContext: NodeStatusContext = useMemo(
    () => ({
      nodeId: id,
      executionState: executionStatusOverride ?? executionState,
      validationState,
      isConnecting,
      isSelected: selected,
      isDragging: dragging,
      mode,
    }),
    [
      id,
      executionStatusOverride,
      executionState,
      validationState,
      isConnecting,
      selected,
      dragging,
      mode,
    ]
  );
  const executionStatus =
    executionStatusOverride ??
    (typeof executionState === 'string' ? executionState : executionState?.status);
  const display = useMemo(
    () => resolveDisplay(manifest?.display, { ...data, nodeId: id }),
    [manifest, data, id]
  );
  const icon = useMemo(() => {
    if (iconComponent !== undefined) return iconComponent;
    // A host's own icon as an image (a data URI it rendered, or a URL), not a registered icon name.
    if (display.icon && isImageIcon(display.icon)) {
      return (
        <img src={display.icon} alt="" draggable={false} className="size-full object-contain" />
      );
    }
    if (display.icon) {
      const IconComponent = getIcon(display.icon);
      return IconComponent ? <IconComponent /> : null;
    }
    return <InitialsBadge name={display.label} size="var(--icon-size)" />;
  }, [iconComponent, display.icon, display.label]);
  const handleConfigurations = useMemo((): HandleGroupManifest[] => {
    if (handleConfigurationsOverride && Array.isArray(handleConfigurationsOverride)) {
      return handleConfigurationsOverride;
    }
    const dataHandleConfigs = (data as Record<string, unknown>)?.handleConfigurations as
      | HandleGroupManifest[]
      | undefined;
    if (dataHandleConfigs && Array.isArray(dataHandleConfigs)) return dataHandleConfigs;
    if (!manifest) return [];
    return resolveHandles(manifest.handleConfiguration, { ...data, nodeId: id }).map((group) => ({
      position: group.position,
      handles: group.handles.map((handle) => ({
        id: handle.id,
        type: handle.type,
        handleType: handle.handleType,
        label: handle.label,
        visible: handle.visible,
        showButton: handle.showButton,
        labelVisibility: handle.labelVisibility,
        constraints: handle.constraints,
      })),
      visible: group.visible,
    }));
  }, [handleConfigurationsOverride, manifest, data, id]);
  // Hidden actions are dropped first. A locked node keeps its toolbar disabled rather than
  // hidden; see `lockToolbarConfig`.
  const toolbarConfig = useMemo((): NodeToolbarConfig | undefined => {
    const resolved = hideToolbarActions(
      toolbarConfigOverride !== undefined
        ? (toolbarConfigOverride ?? undefined)
        : manifest
          ? resolveToolbar(manifest, statusContext, undefined, toolbarActionStore)
          : undefined,
      hiddenToolbarActionIds
    );
    return resolved && isNodeReadOnly ? lockToolbarConfig(resolved) : resolved;
  }, [
    toolbarConfigOverride,
    hiddenToolbarActionIds,
    manifest,
    statusContext,
    toolbarActionStore,
    isNodeReadOnly,
  ]);
  const adornments: NodeAdornments = useMemo(
    () => ({
      ...resolveAdornments(statusContext),
      ...(adornmentsOverride ?? {}),
    }),
    [adornmentsOverride, statusContext]
  );
  const onLabelChange = useCallback(
    ({ label, subLabel }: { label: string; subLabel: string }) => {
      // A cleared label is stored as '' so the node stays unnamed; an unset
      // label would fall back to the manifest label. An empty subLabel is
      // dropped so a label-only edit doesn't add `subLabel: ''` to the node.
      const nextDisplay = { ...data.display, label };
      if (subLabel) nextDisplay.subLabel = subLabel;
      else delete nextDisplay.subLabel;
      updateNodeData(id, { display: nextDisplay });
    },
    [id, data.display, updateNodeData]
  );
  const iconBackground = isDarkMode
    ? (display.iconBackgroundDark ?? display.iconBackground)
    : display.iconBackground;

  return {
    adornments,
    canEdit,
    display,
    executionStatus,
    handleConfigurations,
    icon,
    iconBackground,
    isConnecting,
    isNodeReadOnly,
    manifest,
    mode,
    multipleNodesSelected,
    onLabelChange,
    overrideConfig,
    suggestionType,
    toolbarConfig,
    validationState,
  };
}

/** True for an icon given as an image (`data:image/...` or an http(s) URL) rather than a registered icon name. */
export function isImageIcon(icon: string): boolean {
  return /^(data:image\/|https?:\/\/)/i.test(icon);
}
