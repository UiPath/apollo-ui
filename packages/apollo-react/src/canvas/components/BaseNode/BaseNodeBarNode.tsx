import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  useReactFlow,
  useStore,
  useUpdateNodeInternals,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useEffect, useMemo } from 'react';
import { SEQ_BAR_HEIGHT, SEQ_BAR_WIDTH } from '../../constants';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import type { NodeMenuItem } from '../NodeContextMenu';
import type { BaseNodeData } from './BaseNode.types';
import { BaseNodeBar } from './BaseNodeBar';
import { MissingManifestNode } from './BaseNodeMissingManifest';
import { useBaseNodePresentation } from './useBaseNodePresentation';

export type BaseNodeBarNodeProps = NodeProps<Node<BaseNodeData>> & {
  stacked?: boolean;
  extraMenuItems?: NodeMenuItem[];
};

function BaseNodeBarNodeComponent({
  id,
  data,
  type,
  selected,
  dragging,
  height,
  stacked,
  extraMenuItems,
}: BaseNodeBarNodeProps) {
  const presentation = useBaseNodePresentation({
    id,
    data,
    type,
    selected,
    dragging,
  });
  const { updateNode, getNode } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const barHeight = height ?? SEQ_BAR_HEIGHT;
  // Bar width comes from the node's DECLARED width, not from the `width` prop.
  // XYFlow hands components `measured.width ?? node.width ?? initialWidth ?? 0`,
  // so the prop reports whatever the DOM last measured. That is wrong here in two
  // ways: right after a flow->sequential toggle the clone still carries the
  // `measured` card width it had in flow view (the derivation spreads the
  // canonical node), and an unmeasured node reports `0`. The declared width is the
  // honest signal: `buildSequentialNodes` stamps an explicit `width` (the layout's
  // `barWidth`) on every derived bar, and XYFlow applies that same value as the
  // node wrapper's inline width, so sizing the bar to it is correct by
  // construction.
  //
  // This is a `useStore` SUBSCRIPTION rather than an imperative `getNode` read
  // because the two values move independently: when the declared width changes but
  // `measured.width` has not caught up yet (the "Interactive Sequence" story's
  // barWidth slider does exactly this on every drag), no prop changes, so
  // `areNodePropsEqualIgnoringPosition` would block the re-render and the bar would
  // paint the stale width inside a wrapper XYFlow has already resized. Subscribing
  // makes the declared width itself the trigger. Same pattern and same reasoning as
  // `SequentialConnectorEdge`, which subscribes to its target's declared-then-
  // measured height for the identical one-render slider lag.
  //
  // Falling back to `SEQ_BAR_WIDTH` covers the only path with no declared width:
  // this renderer used outside the sequential derivation, e.g. the isolated
  // `nodes/BarVariant.stories.tsx` card-vs-bar comparison, where the wrapper
  // auto-sizes to the bar instead of the bar to the wrapper.
  const declaredWidth = useStore((state) => state.nodeLookup.get(id)?.width);
  const barWidth = declaredWidth ?? SEQ_BAR_WIDTH;
  const manifestHandleIds = useMemo(() => {
    const sources: string[] = [];
    const targets: string[] = [];
    for (const group of presentation.handleConfigurations) {
      for (const handle of group.handles) {
        if (handle.type === 'source') sources.push(handle.id);
        else if (handle.type === 'target') targets.push(handle.id);
      }
    }
    return { sources, targets };
  }, [presentation.handleConfigurations]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: handle configuration changes require XYFlow to recalculate the bar's invisible anchors.
  useEffect(() => {
    if (getNode(id)?.height !== barHeight) {
      updateNode(id, { height: barHeight });
    }
    updateNodeInternals(id);
  }, [barHeight, id, presentation.handleConfigurations, getNode, updateNode, updateNodeInternals]);

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
    labelBackgroundColor,
    labelTooltip,
    onActionNeeded,
    subLabelComponent,
    suggestionType,
  } = presentation.overrideConfig;

  return (
    <BaseNodeBar
      nodeId={id}
      width={barWidth}
      height={barHeight}
      mode={presentation.mode}
      selected={selected}
      dragging={dragging}
      disabled={disabled}
      label={presentation.display.label}
      subLabel={subLabelComponent ?? presentation.display.subLabel}
      labelTooltip={labelTooltip}
      labelBackgroundColor={labelBackgroundColor}
      icon={presentation.icon}
      loading={data.loading}
      iconBackground={presentation.iconBackground}
      iconColor={presentation.display.color}
      background={presentation.display.background}
      shadow={presentation.display.shadow ?? true}
      executionStatus={presentation.executionStatus}
      validationStatus={presentation.validationState?.validationStatus}
      suggestionType={suggestionType}
      statusIndicator={presentation.adornments.topRight}
      toolbarConfig={presentation.toolbarConfig}
      multipleNodesSelected={presentation.multipleNodesSelected}
      stacked={stacked}
      extraMenuItems={extraMenuItems}
      manifestSourceHandleIds={manifestHandleIds.sources}
      manifestTargetHandleIds={manifestHandleIds.targets}
      onLabelChange={presentation.onLabelChange}
      onActionNeeded={onActionNeeded}
    />
  );
}

export const BaseNodeBarNode = memo(BaseNodeBarNodeComponent, areNodePropsEqualIgnoringPosition);
