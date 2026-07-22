import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { createNode, StoryInfoPanel, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import type { AlignmentGuideLine } from './AlignmentGuides.types';
import { AlignmentGuidesOverlay } from './AlignmentGuidesOverlay';
import { useAlignmentGuides } from './useAlignmentGuides';

const meta: Meta = {
  title: 'Components/Canvas/AlignmentGuides',
  decorators: [withCanvasProviders()],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

function createWorkflowNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'trigger',
      type: 'uipath.manual-trigger',
      position: { x: 80, y: 280 },
      display: { label: 'Start', subLabel: 'Manual trigger', icon: 'play' },
    }),
    createNode({
      id: 'fetch',
      type: 'uipath.blank-node',
      position: { x: 340, y: 120 },
      display: { label: 'Fetch Data', subLabel: 'HTTP request', icon: 'cloud-download' },
    }),
    createNode({
      id: 'validate',
      type: 'uipath.blank-node',
      position: { x: 340, y: 440 },
      display: { label: 'Validate', subLabel: 'Schema check', icon: 'shield-check' },
    }),
    createNode({
      id: 'decision',
      type: 'uipath.blank-node',
      position: { x: 620, y: 280 },
      display: { label: 'Route', subLabel: 'Decision', icon: 'git-branch' },
    }),
    createNode({
      id: 'approve',
      type: 'uipath.blank-node',
      position: { x: 900, y: 120 },
      display: { label: 'Approve', subLabel: 'Human review', icon: 'user-check' },
    }),
    createNode({
      id: 'reject',
      type: 'uipath.blank-node',
      position: { x: 900, y: 440 },
      display: { label: 'Reject', subLabel: 'Auto reject', icon: 'x-circle' },
    }),
    createNode({
      id: 'notify',
      type: 'uipath.blank-node',
      position: { x: 1180, y: 280 },
      display: { label: 'Notify', subLabel: 'Send email', icon: 'mail' },
    }),
  ];
}

const workflowEdges: Edge[] = [
  { id: 'e-trigger-fetch', source: 'trigger', sourceHandle: 'output', target: 'fetch', targetHandle: 'input' },
  { id: 'e-trigger-validate', source: 'trigger', sourceHandle: 'output', target: 'validate', targetHandle: 'input' },
  { id: 'e-fetch-decision', source: 'fetch', sourceHandle: 'output', target: 'decision', targetHandle: 'input' },
  { id: 'e-validate-decision', source: 'validate', sourceHandle: 'output', target: 'decision', targetHandle: 'input' },
  { id: 'e-decision-approve', source: 'decision', sourceHandle: 'output', target: 'approve', targetHandle: 'input' },
  { id: 'e-decision-reject', source: 'decision', sourceHandle: 'output', target: 'reject', targetHandle: 'input' },
  { id: 'e-approve-notify', source: 'approve', sourceHandle: 'output', target: 'notify', targetHandle: 'input' },
  { id: 'e-reject-notify', source: 'reject', sourceHandle: 'output', target: 'notify', targetHandle: 'input' },
];

function AlignmentGuidesDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });
  const { guides, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes);

  return (
    <BaseCanvas
      {...canvasProps}
      mode="design"
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
    >
      <AlignmentGuidesOverlay guides={guides} />
      <StoryInfoPanel title="Alignment guides">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Drag any node. Dashed guide lines appear when its edges or center line up with another
          node's edges or center. Guides are visual only, nothing snaps into place.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const AlignmentGuidesPrototype: Story = {
  name: 'Alignment Guides',
  render: () => <AlignmentGuidesDemo />,
};

// Hand-authored guides matching createWorkflowNodes(): a vertical line through the
// decision/trigger/notify column plus a horizontal line through the top row
// (fetch/approve), rendered with no drag required so both axes are visible at once.
const staticGuides: AlignmentGuideLine[] = [
  { id: 'vertical-620', orientation: 'vertical', position: 620, start: 80, end: 536 },
  { id: 'horizontal-120', orientation: 'horizontal', position: 120, start: 80, end: 996 },
];

function StaticGuidesDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });

  return (
    <BaseCanvas {...canvasProps} mode="view">
      <AlignmentGuidesOverlay guides={staticGuides} />
      <StoryInfoPanel title="Static guide preview">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Hardcoded guide lines (no drag required) for visual QA of both the vertical and
          horizontal line styles at once.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const StaticPreview: Story = {
  name: 'Static Guide Preview',
  render: () => <StaticGuidesDemo />,
};
