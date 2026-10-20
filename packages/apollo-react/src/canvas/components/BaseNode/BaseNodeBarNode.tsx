import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { useStore, useUpdateNodeInternals } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { SEQ_BAR_HEIGHT, SEQ_BAR_WIDTH } from '../../constants';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import type { NodeMenuItem } from '../NodeContextMenu';
import type { BaseNodeData } from './BaseNode.types';
import { BaseNodeBar, type BaseNodeBarAttachment } from './BaseNodeBar';
import { MissingManifestNode } from './BaseNodeMissingManifest';
import { useBaseNodePresentation } from './useBaseNodePresentation';

export type BaseNodeBarNodeProps = NodeProps<Node<BaseNodeData>> & {
  stacked?: boolean;
  extraMenuItems?: NodeMenuItem[];
  attachments?: BaseNodeBarAttachment[];
};

function BaseNodeBarNodeComponent({
  id,
  data,
  type,
  selected,
  dragging,
  stacked,
  extraMenuItems,
  attachments,
}: BaseNodeBarNodeProps) {
  const presentation = useBaseNodePresentation({
    id,
    data,
    type,
    selected,
    dragging,
  });
  const updateNodeInternals = useUpdateNodeInternals();
  // Declared geometry from the controlled array, not the measured props: the measured values
  // are stale after a view toggle and 0 before the first measurement.
  const declaredWidth = useStore((state) => state.nodeLookup.get(id)?.width);
  const declaredHeight = useStore((state) => state.nodeLookup.get(id)?.height);
  const barWidth = declaredWidth ?? SEQ_BAR_WIDTH;
  const barHeight = declaredHeight ?? SEQ_BAR_HEIGHT;
  const manifestHandleIds = useMemo(() => {
    const sources: string[] = [];
    const targets: string[] = [];
    for (const group of presentation.handleConfigurations) {
      for (const handle of group.handles) {
        if (handle.type === 'source') sources.push(handle.id);
        else if (handle.type === 'target') targets.push(handle.id);
      }
    }
    return { sources, targets, key: [...sources, '|', ...targets].join(',') };
  }, [presentation.handleConfigurations]);

  // Re-measure the invisible anchors when the handle set or the bar height changes. The
  // mount pass is skipped: xyflow's ResizeObserver measures handle bounds on first observe
  // (`force: true`), and 150 extra per-bar store updates at mount wake every subscriber.
  const measuredOnce = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the handle-id string, not the array identity.
  useEffect(() => {
    if (!measuredOnce.current) {
      measuredOnce.current = true;
      return;
    }
    updateNodeInternals(id);
  }, [barHeight, id, manifestHandleIds.key, updateNodeInternals]);

  if (!presentation.manifest) {
    return (
      <MissingManifestNode
        type={data.nodeType as string}
        isSelected={selected}
        isHovered={false}
        interactionState={selected ? 'selected' : 'default'}
      />
    );
  }

  const {
    disabled,
    footerComponent,
    labelBackgroundColor,
    labelPlaceholder,
    labelTooltip,
    onActionNeeded,
    subLabelComponent,
    subLabelPlaceholder,
  } = presentation.overrideConfig;
  const isStacked = Boolean(stacked || presentation.manifest.drillable || data?.isCollapsed);

  return (
    <BaseNodeBar
      nodeId={id}
      width={barWidth}
      height={barHeight}
      shape={presentation.display.shape}
      mode={presentation.mode}
      locked={presentation.isNodeReadOnly}
      selected={selected}
      dragging={dragging}
      disabled={disabled}
      label={presentation.display.label}
      // As on the card, an explicit `null` override suppresses the manifest sub-label.
      subLabel={subLabelComponent !== undefined ? subLabelComponent : presentation.display.subLabel}
      labelPlaceholder={labelPlaceholder}
      subLabelPlaceholder={subLabelPlaceholder}
      labelTooltip={labelTooltip}
      labelBackgroundColor={labelBackgroundColor}
      footer={footerComponent}
      icon={presentation.icon}
      loading={data.loading}
      iconBackground={presentation.iconBackground}
      iconColor={presentation.display.color}
      background={presentation.display.background}
      shadow={presentation.display.shadow ?? true}
      executionStatus={presentation.executionStatus}
      validationStatus={presentation.validationState?.validationStatus}
      suggestionType={presentation.suggestionType}
      adornments={presentation.adornments}
      toolbarConfig={presentation.toolbarConfig}
      multipleNodesSelected={presentation.multipleNodesSelected}
      stacked={isStacked}
      extraMenuItems={extraMenuItems}
      attachments={attachments}
      manifestSourceHandleIds={manifestHandleIds.sources}
      manifestTargetHandleIds={manifestHandleIds.targets}
      onLabelChange={presentation.onLabelChange}
      onActionNeeded={onActionNeeded}
    />
  );
}

export const BaseNodeBarNode = memo(BaseNodeBarNodeComponent, areNodePropsEqualIgnoringPosition);
