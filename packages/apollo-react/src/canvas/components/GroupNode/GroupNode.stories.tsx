import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApTooltip } from '@uipath/apollo-react/material/components';
import { useMemo } from 'react';
import { StoryInfoPanel, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import { BaseNode } from '../BaseNode';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import { GroupNode } from './GroupNode';
import type { GroupNodeData } from './GroupNode.types';
import { GroupNodeConfigProvider } from './GroupNodeConfigContext';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta = {
  title: 'Canvas/GroupNode',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Custom Node Types
// ============================================================================

// Use a node type registered in the default manifest to avoid "Manifest not found"
const CHILD_NODE_TYPE = 'uipath.timer-activity';

const nodeTypes = {
  group: GroupNode,
  [CHILD_NODE_TYPE]: BaseNode,
};

// ============================================================================
// Initial Data
// ============================================================================

function createGroupNode(
  id: string,
  title: string,
  iconName: string | undefined,
  position: { x: number; y: number },
  size: { width: number; height: number },
  backgroundColor?: string
): Node<GroupNodeData> {
  return {
    id,
    type: 'group',
    position,
    data: { title, ...(iconName && { iconName }), backgroundColor },
    style: {
      width: size.width,
      height: size.height,
      backgroundColor: 'transparent',
      border: 'none',
      padding: 0,
    },
  };
}

function createChildNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  parentId: string
): Node<BaseNodeData> {
  return {
    id,
    type: CHILD_NODE_TYPE,
    position,
    data: { display: { label } },
    parentId,
    extent: 'parent',
  };
}

function createDefaultNodes(): Node<GroupNodeData | BaseNodeData>[] {
  return [
    // First group - API flow
    createGroupNode('group-1', 'API flow', 'api', { x: 50, y: 100 }, { width: 600, height: 250 }),
    createChildNode('node-1-1', 'Request', { x: 30, y: 60 }, 'group-1'),
    createChildNode('node-1-2', 'Process', { x: 200, y: 60 }, 'group-1'),
    createChildNode('node-1-3', 'Response', { x: 370, y: 60 }, 'group-1'),

    // Second group - Classification agent
    createGroupNode(
      'group-2',
      'Classification agent',
      undefined,
      { x: 750, y: 100 },
      { width: 500, height: 350 },
      'var(--uix-canvas-background-raised)'
    ),
    createChildNode('node-2-1', 'Classification agent', { x: 180, y: 60 }, 'group-2'),
    createChildNode('node-2-2', 'Category A', { x: 30, y: 200 }, 'group-2'),
    createChildNode('node-2-3', 'Category B', { x: 180, y: 200 }, 'group-2'),
    createChildNode('node-2-4', 'Category C', { x: 330, y: 200 }, 'group-2'),
  ];
}

function createDefaultEdges(): Edge[] {
  return [
    // Edges within first group
    { id: 'e1-1-2', source: 'node-1-1', target: 'node-1-2', type: 'smoothstep' },
    { id: 'e1-2-3', source: 'node-1-2', target: 'node-1-3', type: 'smoothstep' },
    // Edges within second group
    { id: 'e2-1-2', source: 'node-2-1', target: 'node-2-2', type: 'smoothstep' },
    { id: 'e2-1-3', source: 'node-2-1', target: 'node-2-3', type: 'smoothstep' },
    { id: 'e2-1-4', source: 'node-2-1', target: 'node-2-4', type: 'smoothstep' },
  ];
}

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo(() => createDefaultNodes(), []);
  const initialEdges = useMemo(() => createDefaultEdges(), []);

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypes} mode="design">
      <StoryInfoPanel
        title="Group Nodes"
        description="Drag groups to move all child nodes together"
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const Default: Story = {
  render: () => <DefaultStory />,
};

function EmptyGroupStory() {
  const initialNodes = useMemo(
    () => [
      createGroupNode(
        'empty-group',
        'Empty Group',
        'folder',
        { x: 200, y: 150 },
        { width: 400, height: 300 }
      ),
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypes} mode="design">
      <StoryInfoPanel title="Empty Group" description="A group node with no children" />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const EmptyGroup: Story = {
  render: () => <EmptyGroupStory />,
};

// ============================================================================
// With Header Actions Story
// ============================================================================

/** Wrapper that injects headerActions via context */
function GroupNodeWithActions(props: React.ComponentProps<typeof GroupNode>) {
  return (
    <GroupNodeConfigProvider
      value={{
        headerActions: (
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--uix-canvas-success-background)',
              color: 'var(--uix-canvas-success-icon)',
              whiteSpace: 'nowrap',
            }}
          >
            Active
          </span>
        ),
      }}
    >
      <GroupNode {...props} />
    </GroupNodeConfigProvider>
  );
}

function WithHeaderActionsStory() {
  const nodeTypesWithActions = useMemo(
    () => ({
      group: GroupNodeWithActions,
      [CHILD_NODE_TYPE]: BaseNode,
    }),
    []
  );

  const initialNodes = useMemo(
    (): Node<GroupNodeData | BaseNodeData>[] => [
      createGroupNode('group-1', 'Agent Workflow', 'smart_toy', { x: 50, y: 100 }, { width: 600, height: 250 }),
      createChildNode('node-1', 'Classifier', { x: 30, y: 60 }, 'group-1'),
      createChildNode('node-2', 'Extractor', { x: 200, y: 60 }, 'group-1'),
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypesWithActions} mode="design">
      <StoryInfoPanel
        title="With Header Actions"
        description="Group node with custom actions in the header via context"
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const WithHeaderActions: Story = {
  render: () => <WithHeaderActionsStory />,
};

// ============================================================================
// With Execution Status Story
// ============================================================================

/** Wrapper that shows execution status in the group header with border coloring and tooltip */
function GroupNodeWithStatus({
  status,
  message,
}: {
  status: string;
  message?: string;
}) {
  return function GroupNodeStatusWrapper(props: React.ComponentProps<typeof GroupNode>) {
    const tooltipContent = message || status;
    return (
      <GroupNodeConfigProvider
        value={{
          executionStatus: status,
          executionMessage: message,
          headerActions: (
            <ApTooltip content={tooltipContent} placement="top">
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                <ExecutionStatusIcon status={status} size={16} />
              </span>
            </ApTooltip>
          ),
        }}
      >
        <GroupNode {...props} />
      </GroupNodeConfigProvider>
    );
  };
}

function WithExecutionStatusStory() {
  const CompletedGroupNode = useMemo(() => GroupNodeWithStatus({ status: 'Completed' }), []);
  const InProgressGroupNode = useMemo(() => GroupNodeWithStatus({ status: 'InProgress' }), []);
  const FailedGroupNode = useMemo(
    () => GroupNodeWithStatus({ status: 'Failed', message: 'SMTP connection refused: unable to reach mail server at port 587' }),
    []
  );
  const PausedGroupNode = useMemo(
    () => GroupNodeWithStatus({ status: 'Paused', message: 'Waiting for manual approval from admin' }),
    []
  );

  const nodeTypesMap = useMemo(
    () => ({
      'group-completed': CompletedGroupNode,
      'group-in-progress': InProgressGroupNode,
      'group-failed': FailedGroupNode,
      'group-paused': PausedGroupNode,
      [CHILD_NODE_TYPE]: BaseNode,
    }),
    [CompletedGroupNode, InProgressGroupNode, FailedGroupNode, PausedGroupNode]
  );

  const initialNodes = useMemo(
    (): Node<GroupNodeData | BaseNodeData>[] => [
      {
        ...createGroupNode('group-completed', 'Data Pipeline', 'account_tree', { x: 50, y: 50 }, { width: 500, height: 220 }),
        type: 'group-completed',
      },
      createChildNode('n-c-1', 'Validate', { x: 30, y: 60 }, 'group-completed'),
      createChildNode('n-c-2', 'Transform', { x: 200, y: 60 }, 'group-completed'),
      createChildNode('n-c-3', 'Store', { x: 370, y: 60 }, 'group-completed'),

      {
        ...createGroupNode('group-in-progress', 'ML Training', 'model_training', { x: 620, y: 50 }, { width: 400, height: 220 }),
        type: 'group-in-progress',
      },
      createChildNode('n-ip-1', 'Preprocess', { x: 30, y: 60 }, 'group-in-progress'),
      createChildNode('n-ip-2', 'Train', { x: 200, y: 60 }, 'group-in-progress'),

      {
        ...createGroupNode('group-failed', 'Email Sender', 'mail', { x: 50, y: 340 }, { width: 400, height: 220 }),
        type: 'group-failed',
      },
      createChildNode('n-f-1', 'Template', { x: 30, y: 60 }, 'group-failed'),
      createChildNode('n-f-2', 'Send', { x: 200, y: 60 }, 'group-failed'),

      {
        ...createGroupNode('group-paused', 'Approval Flow', 'approval', { x: 520, y: 340 }, { width: 500, height: 220 }),
        type: 'group-paused',
      },
      createChildNode('n-p-1', 'Request', { x: 30, y: 60 }, 'group-paused'),
      createChildNode('n-p-2', 'Review', { x: 200, y: 60 }, 'group-paused'),
      createChildNode('n-p-3', 'Approve', { x: 370, y: 60 }, 'group-paused'),
    ],
    []
  );

  const initialEdges = useMemo(
    (): Edge[] => [
      { id: 'e-c-1-2', source: 'n-c-1', target: 'n-c-2', type: 'smoothstep' },
      { id: 'e-c-2-3', source: 'n-c-2', target: 'n-c-3', type: 'smoothstep' },
      { id: 'e-ip-1-2', source: 'n-ip-1', target: 'n-ip-2', type: 'smoothstep' },
      { id: 'e-f-1-2', source: 'n-f-1', target: 'n-f-2', type: 'smoothstep' },
      { id: 'e-p-1-2', source: 'n-p-1', target: 'n-p-2', type: 'smoothstep' },
      { id: 'e-p-2-3', source: 'n-p-2', target: 'n-p-3', type: 'smoothstep' },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypesMap} mode="design">
      <StoryInfoPanel
        title="With Execution Status"
        description="Group nodes showing different execution statuses (Completed, In Progress, Failed, Paused)"
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const WithExecutionStatus: Story = {
  render: () => <WithExecutionStatusStory />,
};

// ============================================================================
// Without Collapse Story
// ============================================================================

/** Wrapper that hides the collapse button via context */
function GroupNodeNoCollapse(props: React.ComponentProps<typeof GroupNode>) {
  return (
    <GroupNodeConfigProvider value={{ hideCollapseButton: true }}>
      <GroupNode {...props} />
    </GroupNodeConfigProvider>
  );
}

function WithoutCollapseStory() {
  const nodeTypesNoCollapse = useMemo(
    () => ({
      group: GroupNodeNoCollapse,
      [CHILD_NODE_TYPE]: BaseNode,
    }),
    []
  );

  const initialNodes = useMemo(
    (): Node<GroupNodeData | BaseNodeData>[] => [
      createGroupNode('group-1', 'Static Group', 'lock', { x: 50, y: 100 }, { width: 600, height: 250 }),
      createChildNode('node-1', 'Step A', { x: 30, y: 60 }, 'group-1'),
      createChildNode('node-2', 'Step B', { x: 200, y: 60 }, 'group-1'),
      createChildNode('node-3', 'Step C', { x: 370, y: 60 }, 'group-1'),
    ],
    []
  );

  const initialEdges = useMemo(
    (): Edge[] => [
      { id: 'e-1-2', source: 'node-1', target: 'node-2', type: 'smoothstep' },
      { id: 'e-2-3', source: 'node-2', target: 'node-3', type: 'smoothstep' },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypesNoCollapse} mode="design">
      <StoryInfoPanel
        title="Without Collapse"
        description="Group node with the collapse/expand button hidden via hideCollapseButton"
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const WithoutCollapse: Story = {
  render: () => <WithoutCollapseStory />,
};

// ============================================================================
// Minimal with Execution Status Story
// ============================================================================

/** Wrapper: execution status + no collapse + no 3-dot menu */
function GroupNodeMinimalWithStatus({
  status,
  message,
}: {
  status: string;
  message?: string;
}) {
  return function GroupNodeMinimalStatusWrapper(props: React.ComponentProps<typeof GroupNode>) {
    const tooltipContent = message || status;
    return (
      <GroupNodeConfigProvider
        value={{
          executionStatus: status,
          executionMessage: message,
          hideCollapseButton: true,
          hideMoreOptions: true,
          headerActions: (
            <ApTooltip content={tooltipContent} placement="top">
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                <ExecutionStatusIcon status={status} size={16} />
              </span>
            </ApTooltip>
          ),
        }}
      >
        <GroupNode {...props} />
      </GroupNodeConfigProvider>
    );
  };
}

function MinimalWithExecutionStatusStory() {
  const CompletedNode = useMemo(() => GroupNodeMinimalWithStatus({ status: 'Completed' }), []);
  const FailedNode = useMemo(
    () => GroupNodeMinimalWithStatus({ status: 'Failed', message: 'Timeout after 30s' }),
    []
  );

  const nodeTypesMap = useMemo(
    () => ({
      'group-completed': CompletedNode,
      'group-failed': FailedNode,
      [CHILD_NODE_TYPE]: BaseNode,
    }),
    [CompletedNode, FailedNode]
  );

  const initialNodes = useMemo(
    (): Node<GroupNodeData | BaseNodeData>[] => [
      {
        ...createGroupNode('group-completed', 'ETL Pipeline', 'account_tree', { x: 50, y: 100 }, { width: 500, height: 220 }),
        type: 'group-completed',
      },
      createChildNode('n-c-1', 'Extract', { x: 30, y: 60 }, 'group-completed'),
      createChildNode('n-c-2', 'Load', { x: 200, y: 60 }, 'group-completed'),
      createChildNode('n-c-3', 'Transform', { x: 370, y: 60 }, 'group-completed'),

      {
        ...createGroupNode('group-failed', 'Notification Service', 'mail', { x: 620, y: 100 }, { width: 400, height: 220 }),
        type: 'group-failed',
      },
      createChildNode('n-f-1', 'Template', { x: 30, y: 60 }, 'group-failed'),
      createChildNode('n-f-2', 'Send', { x: 200, y: 60 }, 'group-failed'),
    ],
    []
  );

  const initialEdges = useMemo(
    (): Edge[] => [
      { id: 'e-c-1-2', source: 'n-c-1', target: 'n-c-2', type: 'smoothstep' },
      { id: 'e-c-2-3', source: 'n-c-2', target: 'n-c-3', type: 'smoothstep' },
      { id: 'e-f-1-2', source: 'n-f-1', target: 'n-f-2', type: 'smoothstep' },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypesMap} mode="design">
      <StoryInfoPanel
        title="Minimal with Execution Status"
        description="Execution status borders and icons, no collapse button, no 3-dot menu"
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const MinimalWithExecutionStatus: Story = {
  render: () => <MinimalWithExecutionStatusStory />,
};

// ============================================================================
// Minimal Story (no execution status, no collapse, no 3-dot menu)
// ============================================================================

/** Wrapper: no collapse + no 3-dot menu */
function GroupNodeMinimal(props: React.ComponentProps<typeof GroupNode>) {
  return (
    <GroupNodeConfigProvider value={{ hideCollapseButton: true, hideMoreOptions: true }}>
      <GroupNode {...props} />
    </GroupNodeConfigProvider>
  );
}

function MinimalStory() {
  const nodeTypesMinimal = useMemo(
    () => ({
      group: GroupNodeMinimal,
      [CHILD_NODE_TYPE]: BaseNode,
    }),
    []
  );

  const initialNodes = useMemo(
    (): Node<GroupNodeData | BaseNodeData>[] => [
      createGroupNode('group-1', 'Simple Group', 'folder', { x: 50, y: 100 }, { width: 600, height: 250 }),
      createChildNode('node-1', 'Step A', { x: 30, y: 60 }, 'group-1'),
      createChildNode('node-2', 'Step B', { x: 200, y: 60 }, 'group-1'),
      createChildNode('node-3', 'Step C', { x: 370, y: 60 }, 'group-1'),

      createGroupNode('group-2', 'No Icon Group', undefined, { x: 750, y: 100 }, { width: 400, height: 250 }),
      createChildNode('node-4', 'Task 1', { x: 30, y: 60 }, 'group-2'),
      createChildNode('node-5', 'Task 2', { x: 200, y: 60 }, 'group-2'),
    ],
    []
  );

  const initialEdges = useMemo(
    (): Edge[] => [
      { id: 'e-1-2', source: 'node-1', target: 'node-2', type: 'smoothstep' },
      { id: 'e-2-3', source: 'node-2', target: 'node-3', type: 'smoothstep' },
      { id: 'e-4-5', source: 'node-4', target: 'node-5', type: 'smoothstep' },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypesMinimal} mode="design">
      <StoryInfoPanel
        title="Minimal"
        description="Group node with no collapse, no 3-dot menu, and no execution status — title only"
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const Minimal: Story = {
  render: () => <MinimalStory />,
};
