import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createNode,
  HandleConfigs,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { compactAlignNodes, subtleAlignNodes, TIDY_UP_STRATEGIES } from '../../utils/tidy-up';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasZoomControls, type TidyUpMenuOption } from './CanvasZoomControls';

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

function VerticalStory() {
  const { canvasProps } = useCanvasStory({ initialNodes: [], initialEdges: [] });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasZoomControls />
      </Panel>
      <StoryInfoPanel
        title="Zoom controls — vertical"
        description="Default vertical orientation. Zoom in, zoom out, and fit to screen buttons are stacked vertically."
      />
    </BaseCanvas>
  );
}

function HorizontalStory() {
  const { canvasProps } = useCanvasStory({ initialNodes: [], initialEdges: [] });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-center">
        <CanvasZoomControls orientation="horizontal" />
      </Panel>
      <StoryInfoPanel
        title="Zoom controls — horizontal"
        description="Horizontal orientation. Buttons are laid out in a row."
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
        description={`Includes the optional "Tidy up" button. Organize pressed: ${organizeCount} time${organizeCount === 1 ? '' : 's'}.`}
      />
    </BaseCanvas>
  );
}

function WithTidyUpMenuStory() {
  const { canvasProps } = useCanvasStory({ initialNodes: [], initialEdges: [] });
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasZoomControls
          orientation="vertical"
          tidyUpOptions={[
            ...TIDY_UP_STRATEGIES,
            {
              id: 'reset',
              label: 'Reset to original',
              separatorBefore: true,
            },
          ]}
          onTidyUpSelect={setLastSelected}
        />
      </Panel>
      <StoryInfoPanel
        title="Zoom controls: with tidy up menu"
        description={`The "Tidy up" button opens a menu of strategies instead of running one hardcoded action -- a destructive/reset-style option can be set apart with "separatorBefore". Last selected: ${lastSelected ?? 'none'}. See "With Tidy Up Menu and Interaction" below for the strategies actually applied to a real workflow.`}
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
          optionId === 'horizontal' ? HandleConfigs.inputOutput : HandleConfigs.topBottom;
        compactAlignNodes(canvasProps.nodes, messyEdges, undefined, direction)
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
        description: 'Re-flows left-to-right.',
      },
      {
        id: 'vertical',
        label: 'Vertical layout',
        description: 'Re-flows top-to-bottom.',
      },
      {
        id: 'reset',
        label: 'Reset to original',
        disabled: isTidying,
        separatorBefore: true,
      },
    ],
    [isTidying]
  );

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasZoomControls
          orientation="vertical"
          tidyUpOptions={tidyUpOptions}
          onTidyUpSelect={handleTidyUpSelect}
        />
      </Panel>
      <StoryInfoPanel
        title="Zoom controls: with tidy up menu and interaction"
        description={
          isTidying
            ? 'Tidying up...'
            : "This workflow's nodes were placed carelessly. Click the brush icon in the bottom-right toolbar to pick a strategy: Subtle align nudges nearly-aligned nodes onto a shared grid without changing the overall shape. Compact layout re-flows everything left-to-right. Horizontal layout does the same but also forces every handle back to left/right. Vertical layout re-flows top-to-bottom and flips handles to match. Reset to original restores the initial mess so you can try again."
        }
      />
    </BaseCanvas>
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

export const WithTidyUpMenu: Story = {
  name: 'Tidy up menu',
  render: () => <WithTidyUpMenuStory />,
};

export const WithTidyUpMenuAndInteraction: Story = {
  name: 'Tidy up interactions',
  render: () => <WithTidyUpMenuAndInteractionStory />,
};
