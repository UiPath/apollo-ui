import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo } from 'react';
import { useNodeTypeRegistry } from '../../core';
import { useElementValidationStatus, useNodeExecutionState } from '../../hooks';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { resolveAdornments } from '../../utils/adornment-resolver';
import { getIcon } from '../../utils/icon-registry';
import { resolveDisplay, resolveHandles } from '../../utils/manifest-resolver';
import { selectIsConnecting } from '../../utils/NodeUtils';
import { resolveToolbar } from '../../utils/toolbar-resolver';
import { useBaseCanvasMode } from '../BaseCanvas/BaseCanvasModeProvider';
import { useCanvasTheme } from '../BaseCanvas/CanvasThemeContext';
import { useSelectionState } from '../BaseCanvas/SelectionStateContext';
import { InitialsBadge } from '../shared/InitialsBadge';
import type { BaseNodeData, NodeAdornments, NodeStatusContext } from './BaseNode.types';
import { useBaseNodeOverrideConfig } from './BaseNodeConfigContext';

type PresentationNodeProps = Pick<
  NodeProps<Node<BaseNodeData>>,
  'data' | 'dragging' | 'id' | 'selected' | 'type'
>;

/**
 * Manifest-backed presentation model shared by the card and sequential bar
 * node renderers. View selection stays outside this hook: both renderers
 * resolve the same display, icon, handles, toolbar, adornments, and statuses,
 * then render their own geometry and interactions.
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
    adornments: adornmentsOverride,
    iconComponent,
  } = overrideConfig;
  const executionState = useNodeExecutionState(id);
  const validationState = useElementValidationStatus(id);
  const nodeTypeRegistry = useNodeTypeRegistry();
  const { mode } = useBaseCanvasMode();
  const isConnecting = useStore(selectIsConnecting);
  const { multipleNodesSelected } = useSelectionState();
  const { isDarkMode } = useCanvasTheme();
  const { updateNodeData } = useReactFlow();

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
  const toolbarConfig = useMemo(() => {
    if (toolbarConfigOverride !== undefined) {
      return toolbarConfigOverride === null ? undefined : toolbarConfigOverride;
    }
    return manifest ? resolveToolbar(manifest, statusContext) : undefined;
  }, [toolbarConfigOverride, manifest, statusContext]);
  const adornments: NodeAdornments = useMemo(
    () => ({
      ...resolveAdornments(statusContext),
      ...(adornmentsOverride ?? {}),
    }),
    [adornmentsOverride, statusContext]
  );
  const onLabelChange = useCallback(
    (values: { label: string; subLabel: string }) => {
      const nextDisplay = { ...data.display };
      for (const labelKey of Object.keys(values) as (keyof typeof values)[]) {
        if (values[labelKey]) nextDisplay[labelKey] = values[labelKey];
        else delete nextDisplay[labelKey];
      }
      updateNodeData(id, { display: nextDisplay });
    },
    [id, data.display, updateNodeData]
  );
  const iconBackground = isDarkMode
    ? (display.iconBackgroundDark ?? display.iconBackground)
    : display.iconBackground;

  return {
    adornments,
    display,
    executionStatus,
    handleConfigurations,
    icon,
    iconBackground,
    isConnecting,
    manifest,
    mode,
    multipleNodesSelected,
    onLabelChange,
    overrideConfig,
    toolbarConfig,
    validationState,
  };
}
