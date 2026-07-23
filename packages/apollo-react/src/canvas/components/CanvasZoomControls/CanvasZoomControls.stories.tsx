import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, Position, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { CanvasIcon } from '../../utils/icon-registry';
import { compactAlignNodes, subtleAlignNodes, TIDY_UP_STRATEGIES } from '../../utils/tidy-up';
import { BaseCanvas } from '../BaseCanvas';
import { BaseNodeOverrideConfigProvider } from '../BaseNode';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import type { NodeToolbarConfig } from '../Toolbar';
import { CanvasZoomControls, type TidyUpMenuOption } from './CanvasZoomControls';

// Handle presets for "Horizontal layout"/"Vertical layout", scoped to this
// story only. Deliberately label-less (unlike storybook-utils' HandleConfigs
// presets): at compact spacing, an "Input"/"Output" caption overlaps the
// neighboring node's own label/subLabel text. Only the handle *position*
// (left/right vs top/bottom) matters for keeping edges straight.
const LEFT_RIGHT_HANDLES = [
  {
    position: Position.Left,
    handles: [{ id: 'input', type: 'target' as const, handleType: 'input' as const }],
  },
  {
    position: Position.Right,
    handles: [{ id: 'output', type: 'source' as const, handleType: 'output' as const }],
  },
];
const TOP_BOTTOM_HANDLES = [
  {
    position: Position.Top,
    handles: [{ id: 'input', type: 'target' as const, handleType: 'input' as const }],
  },
  {
    position: Position.Bottom,
    handles: [{ id: 'output', type: 'source' as const, handleType: 'output' as const }],
  },
];

// Wider than compactAlignNodes' own default spacing -- used only by
// "Horizontal layout"/"Vertical layout" for a less cramped feel. Compact
// layout keeps its own default untouched.
const SPACIOUS_LAYOUT_SPACING: [number, number] = [80, 96];

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof CanvasZoomControls> = {
  title: 'Components/Controls/CanvasZoomControls',
  component: CanvasZoomControls,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof CanvasZoomControls>;

// ============================================================================
// Story Components
// ============================================================================

// A component consumer can pass onOrganize, tidyUpOptions, both, or neither --
// the "Tidy up" icon only renders when one of those is provided. Shown here so
// Vertical/Horizontal double as the canonical full-toolbar reference for each
// orientation, not just zoom/fit.
const REFERENCE_TIDY_UP_OPTIONS: TidyUpMenuOption[] = [
  ...TIDY_UP_STRATEGIES,
  {
    id: 'reset',
    label: 'Reset to original',
    icon: 'rotate-ccw',
    separatorBefore: true,
  },
];

function VerticalStory() {
  const { canvasProps } = useCanvasStory({ initialNodes: [], initialEdges: [] });
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasZoomControls
          tidyUpOptions={REFERENCE_TIDY_UP_OPTIONS}
          onTidyUpSelect={setLastSelected}
        />
      </Panel>
      <StoryInfoPanel
        title="Zoom controls — vertical"
        description={`Default vertical orientation. Zoom in, zoom out, fit to screen, and Tidy up are stacked vertically. Last selected: ${lastSelected ?? 'none'}.`}
      />
    </BaseCanvas>
  );
}

function HorizontalStory() {
  const { canvasProps } = useCanvasStory({ initialNodes: [], initialEdges: [] });
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-center">
        <CanvasZoomControls
          orientation="horizontal"
          tidyUpOptions={REFERENCE_TIDY_UP_OPTIONS}
          onTidyUpSelect={setLastSelected}
        />
      </Panel>
      <StoryInfoPanel
        title="Zoom controls — horizontal"
        description={`Horizontal orientation. Buttons, including Tidy up, are laid out in a row. Last selected: ${lastSelected ?? 'none'}.`}
      />
    </BaseCanvas>
  );
}

function WithOrganizeStory() {
  const { canvasProps } = useCanvasStory({ initialNodes: [], initialEdges: [] });
  const [organizeCount, setOrganizeCount] = useState(0);

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasZoomControls
          orientation="vertical"
          onOrganize={() => setOrganizeCount((c) => c + 1)}
        />
      </Panel>
      <StoryInfoPanel
        title="Zoom controls — with organize"
        description={`Uses "onOrganize" -- a single hardcoded action on click, no menu. This is what AgentCanvas uses in production today. Compare to Vertical/Horizontal, which use "tidyUpOptions" for a menu of strategies instead. Organize pressed: ${organizeCount} time${organizeCount === 1 ? '' : 's'}.`}
      />
    </BaseCanvas>
  );
}

// ----------------------------------------------------------------------------
// "With Tidy Up Menu and Interaction" -- a workflow whose nodes were dropped
// carelessly (rows are almost-but-not-quite aligned, spacing is inconsistent)
// so the tidy-up menu has something real to fix.
// ----------------------------------------------------------------------------

function createMessyNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'trigger',
      type: 'uipath.manual-trigger',
      position: { x: 80, y: 210 },
      display: { label: 'Manual trigger' },
    }),
    createNode({
      id: 'fetch-data',
      type: 'uipath.blank-node',
      position: { x: 340, y: 40 },
      display: { label: 'Fetch data', subLabel: 'HTTP request' },
    }),
    createNode({
      id: 'validate',
      type: 'uipath.blank-node',
      position: { x: 345, y: 385 },
      display: { label: 'Validate input', subLabel: 'Rules engine' },
    }),
    createNode({
      id: 'transform',
      type: 'uipath.blank-node',
      position: { x: 625, y: 22 },
      display: { label: 'Transform data', subLabel: 'Data mapper' },
    }),
    createNode({
      id: 'enrich',
      type: 'uipath.blank-node',
      position: { x: 608, y: 412 },
      display: { label: 'Enrich record', subLabel: 'AI agent' },
    }),
    createNode({
      id: 'merge',
      type: 'uipath.blank-node',
      position: { x: 905, y: 195 },
      display: { label: 'Merge results' },
    }),
    createNode({
      id: 'notify',
      type: 'uipath.blank-node',
      position: { x: 1155, y: 168 },
      display: { label: 'Send notification', subLabel: 'Slack integration' },
    }),
    createNode({
      id: 'archive',
      type: 'uipath.blank-node',
      position: { x: 1162, y: 262 },
      display: { label: 'Archive record', subLabel: 'Storage bucket' },
    }),
  ];
}

function messyEdge(id: string, source: string, target: string): Edge {
  return { id, source, target, sourceHandle: 'output', targetHandle: 'input' };
}

// Keyed by node id so "Reset to original" can restore positions on the
// existing node objects (preserving their measured dimensions) instead of
// replacing them outright, which would force React Flow to re-measure
// before fitView can compute correct bounds.
const MESSY_POSITIONS: Record<string, { x: number; y: number }> = Object.fromEntries(
  createMessyNodes().map((node) => [node.id, node.position])
);

const messyEdges: Edge[] = [
  messyEdge('e-trigger-fetch', 'trigger', 'fetch-data'),
  messyEdge('e-trigger-validate', 'trigger', 'validate'),
  messyEdge('e-fetch-transform', 'fetch-data', 'transform'),
  messyEdge('e-validate-enrich', 'validate', 'enrich'),
  messyEdge('e-transform-merge', 'transform', 'merge'),
  messyEdge('e-enrich-merge', 'enrich', 'merge'),
  messyEdge('e-merge-notify', 'merge', 'notify'),
  messyEdge('e-merge-archive', 'merge', 'archive'),
];

function WithTidyUpMenuAndInteractionStory() {
  const initialNodes = useMemo(() => createMessyNodes(), []);
  const { canvasProps, setNodes } = useCanvasStory({
    initialNodes,
    initialEdges: messyEdges,
  });
  const [isTidying, setIsTidying] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const { fitView } = useReactFlow();

  // Nodes can move well outside the current viewport (especially with
  // "Compact layout"), so re-fit the camera after every layout change. This
  // runs after BaseCanvas/xyflow's own effects have synced the new
  // positions, since child effects commit before parent effects.
  useEffect(() => {
    if (layoutVersion === 0) {
      return;
    }
    fitView({ duration: 400, padding: 0.2 });
  }, [layoutVersion, fitView]);

  const handleTidyUpSelect = useCallback(
    (optionId: string) => {
      if (optionId === 'subtle') {
        setNodes((current) => subtleAlignNodes(current));
        setLayoutVersion((v) => v + 1);
        return;
      }

      if (optionId === 'compact') {
        setIsTidying(true);
        compactAlignNodes(canvasProps.nodes, messyEdges)
          .then((laidOut) => {
            setNodes(laidOut);
            setLayoutVersion((v) => v + 1);
          })
          .finally(() => setIsTidying(false));
        return;
      }

      if (optionId === 'horizontal' || optionId === 'vertical') {
        setIsTidying(true);
        const direction = optionId === 'horizontal' ? 'LR' : 'TD';
        // Handles are side-mounted (left/right) by default, matching a
        // horizontal flow. A vertical layout needs top/bottom handles too --
        // otherwise every edge still has to bend around the node to reach a
        // side handle, defeating the point of re-flowing top-to-bottom.
        const handleConfigurations =
          optionId === 'horizontal' ? LEFT_RIGHT_HANDLES : TOP_BOTTOM_HANDLES;
        compactAlignNodes(canvasProps.nodes, messyEdges, SPACIOUS_LAYOUT_SPACING, direction)
          .then((laidOut) => {
            setNodes(
              laidOut.map((node) => ({ ...node, data: { ...node.data, handleConfigurations } }))
            );
            setLayoutVersion((v) => v + 1);
          })
          .finally(() => setIsTidying(false));
        return;
      }

      if (optionId === 'reset') {
        setNodes((current) =>
          current.map((node) => ({
            ...node,
            position: MESSY_POSITIONS[node.id] ?? node.position,
            // Clear the override so handles fall back to their manifest
            // default (left/right), matching the original messy state.
            data: { ...node.data, handleConfigurations: undefined },
          }))
        );
        setLayoutVersion((v) => v + 1);
      }
    },
    [canvasProps.nodes, setNodes]
  );

  const tidyUpOptions: TidyUpMenuOption[] = useMemo(
    () => [
      ...TIDY_UP_STRATEGIES,
      {
        id: 'horizontal',
        label: 'Horizontal layout',
        icon: 'move-horizontal',
      },
      {
        id: 'vertical',
        label: 'Vertical layout',
        icon: 'move-vertical',
      },
      {
        id: 'reset',
        label: 'Reset to original',
        icon: 'rotate-ccw',
        disabled: isTidying,
        separatorBefore: true,
      },
    ],
    [isTidying]
  );

  // Story-scoped only: overrides every node's toolbar to add the same tidy-up
  // strategies to its "more options" overflow menu, so a user can trigger
  // them from a node's own toolbar as well as the corner control. Uses
  // BaseNodeOverrideConfigProvider rather than extending the real
  // uipath.blank-node/uipath.manual-trigger manifests, so this has no effect
  // outside this one story.
  const nodeToolbarConfig: NodeToolbarConfig = useMemo(
    () => ({
      actions: [
        {
          id: 'delete',
          icon: <CanvasIcon icon="trash" size={14} />,
          label: 'Delete',
          onAction: () => {},
        },
        {
          id: 'duplicate',
          icon: <CanvasIcon icon="copy" size={14} />,
          label: 'Duplicate',
          onAction: () => {},
        },
        {
          id: 'breakpoint',
          icon: <CanvasIcon icon="circle" size={14} />,
          label: 'Toggle breakpoint',
          onAction: () => {},
        },
      ],
      overflowLabel: 'Tidy up',
      overflowActions: [
        {
          id: 'subtle',
          icon: <CanvasIcon icon="grid-3x3" size={14} />,
          label: 'Subtle align',
          onAction: () => handleTidyUpSelect('subtle'),
        },
        {
          id: 'compact',
          icon: <CanvasIcon icon="shrink" size={14} />,
          label: 'Compact layout',
          onAction: () => handleTidyUpSelect('compact'),
        },
        {
          id: 'horizontal',
          icon: <CanvasIcon icon="move-horizontal" size={14} />,
          label: 'Horizontal layout',
          onAction: () => handleTidyUpSelect('horizontal'),
        },
        {
          id: 'vertical',
          icon: <CanvasIcon icon="move-vertical" size={14} />,
          label: 'Vertical layout',
          onAction: () => handleTidyUpSelect('vertical'),
        },
        { id: 'separator' },
        {
          id: 'reset',
          icon: <CanvasIcon icon="rotate-ccw" size={14} />,
          label: 'Reset to original',
          disabled: isTidying,
          onAction: () => handleTidyUpSelect('reset'),
        },
      ],
    }),
    [handleTidyUpSelect, isTidying]
  );

  return (
    <BaseNodeOverrideConfigProvider value={{ toolbarConfig: nodeToolbarConfig }}>
      <BaseCanvas {...canvasProps} mode="design">
        <Panel position="bottom-right">
          <CanvasZoomControls
            orientation="vertical"
            tidyUpOptions={tidyUpOptions}
            onTidyUpSelect={handleTidyUpSelect}
          />
        </Panel>
        <StoryInfoPanel
          title="Zoom controls: tidy up on a workflow"
          description={
            isTidying
              ? 'Tidying up...'
              : 'This workflow\'s nodes were placed carelessly. Trigger a strategy from the brush icon in the bottom-right toolbar, or from the "Tidy up" overflow menu above any node. Subtle align nudges nearly-aligned nodes onto a shared grid without changing the overall shape. Compact layout re-flows everything left-to-right. Horizontal layout does the same but also forces every handle back to left/right. Vertical layout re-flows top-to-bottom and flips handles to match. Reset to original restores the initial mess so you can try again.'
          }
        />
      </BaseCanvas>
    </BaseNodeOverrideConfigProvider>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Vertical: Story = {
  name: 'Vertical',
  render: () => <VerticalStory />,
};

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => <HorizontalStory />,
};

export const WithOrganize: Story = {
  name: 'Tidy up',
  render: () => <WithOrganizeStory />,
};

export const WithTidyUpMenuAndInteraction: Story = {
  name: 'Tidy up: workflow',
  render: () => <WithTidyUpMenuAndInteractionStory />,
};
