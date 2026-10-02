import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  Panel,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo } from 'react';
import { NodeRegistryProvider } from '../../core';
import { useAddNodeOnConnectEnd } from '../../hooks';
import type { NodeManifest } from '../../schema/node-definition';
import {
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { defaultWorkflowManifest } from '../../storybook-utils/manifests';
import { DefaultCanvasTranslations } from '../../types';
import { removePreviewFromReactFlow } from '../../utils/createPreviewNode';
import { CanvasIcon } from '../../utils/icon-registry';
import { AddNodeManager } from '../AddNodePanel';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { LoopNode } from '../LoopNode/LoopNode';
import { ContainerBadge } from './ContainerBadge';
import { ContainerNode } from './ContainerNode';
import type { ContainerNodeData } from './ContainerNode.types';

const LOOP_TYPE = 'uipath.control-flow.foreach';
const ERROR_HANDLER_TYPE = 'story.container.error-handler';
const GROUP_TYPE = 'story.container.group';
const SCOPE_TYPE = 'story.container.scope';
const ACTIVITY_TYPE = 'uipath.blank-node';

const outerHandles: NodeManifest['handleConfiguration'] = [
  { position: 'left', handles: [{ id: 'input', type: 'target', handleType: 'input' }] },
  { position: 'right', handles: [{ id: 'success', type: 'source', handleType: 'output' }] },
];

/** An inner entry handle only: the add-first-step button still shows. */
const entryOnlyInnerHandles: NodeManifest['handleConfiguration'] = [
  {
    position: 'left',
    boundary: 'inner',
    handles: [{ id: 'entry', label: 'Start', type: 'source', handleType: 'output' }],
  },
];

const innerSequenceHandles: NodeManifest['handleConfiguration'] = [
  ...entryOnlyInnerHandles,
  {
    position: 'right',
    boundary: 'inner',
    handles: [{ id: 'done', label: 'Done', type: 'target', handleType: 'input' }],
  },
];

const storyContainerManifests: NodeManifest[] = [
  {
    nodeType: ERROR_HANDLER_TYPE,
    version: '1',
    category: 'control-flow',
    tags: ['control-flow', 'error'],
    sortOrder: 90,
    display: {
      label: 'Error handler',
      icon: 'triangle-alert',
      shape: 'container',
      container: {
        kind: 'error-handler',
        badge: false,
        subtitle: 'Runs on any unhandled error, from any entry point',
        emptyStateLabel: 'Add a step to run on error',
        borderStyle: 'dashed',
        accent: 'warning',
        bodyFrame: 'dashed',
      },
    },
    handleConfiguration: entryOnlyInnerHandles,
  },
  {
    nodeType: GROUP_TYPE,
    version: '1',
    category: 'control-flow',
    tags: ['control-flow', 'group'],
    sortOrder: 91,
    display: {
      label: 'Group',
      icon: 'group',
      shape: 'container',
      container: {
        kind: 'group',
        badge: false,
        emptyStateLabel: 'Add a step to the group',
        bodyFrame: 'solid',
      },
    },
    handleConfiguration: [...outerHandles, ...innerSequenceHandles],
  },
  {
    nodeType: SCOPE_TYPE,
    version: '1',
    category: 'control-flow',
    tags: ['control-flow', 'scope'],
    sortOrder: 92,
    display: {
      label: 'Try',
      icon: 'shield-check',
      shape: 'container',
      container: {
        kind: 'try-catch',
        badge: 'Catch',
        accent: 'info',
        radius: 'xl',
      },
    },
    handleConfiguration: [...outerHandles, ...innerSequenceHandles],
  },
];

const SLOT_TYPES = [
  'story.slot.subtitle',
  'story.slot.header',
  'story.slot.empty-state',
  'story.slot.label',
] as const;

// Slot demos pass props from their node component, so their manifests only
// opt out of the loop preset.
const slotManifests: NodeManifest[] = SLOT_TYPES.map((nodeType, index) => ({
  nodeType,
  version: '1',
  category: 'control-flow',
  tags: ['story'],
  sortOrder: 100 + index,
  display: { label: 'Container', icon: 'box', shape: 'container', container: {} },
  handleConfiguration: [...outerHandles, ...innerSequenceHandles],
}));

const EDITABLE_TYPE = 'story.container.editable';

// Inline editing is opt-in. This manifest turns it on for every node of its type.
const editableManifest: NodeManifest = {
  nodeType: EDITABLE_TYPE,
  version: '1',
  category: 'control-flow',
  tags: ['story'],
  sortOrder: 110,
  display: {
    label: 'Error handler',
    icon: 'triangle-alert',
    shape: 'container',
    container: {
      kind: 'error-handler',
      badge: false,
      subtitle: 'Runs on any unhandled error, from any entry point',
      borderStyle: 'dashed',
      accent: 'warning',
      labelEditable: true,
    },
  },
  handleConfiguration: entryOnlyInnerHandles,
};

const storyManifest = {
  ...defaultWorkflowManifest,
  nodes: [
    ...defaultWorkflowManifest.nodes,
    ...storyContainerManifests,
    ...slotManifests,
    editableManifest,
    {
      ...(defaultWorkflowManifest.nodes.find(
        (node) => node.nodeType === LOOP_TYPE
      ) as NodeManifest),
      nodeType: 'story.editable.loop',
      sortOrder: 111,
    },
  ],
};

const meta: Meta = {
  title: 'Components/Nodes/ContainerNode',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={storyManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
    withCanvasProviders(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

function createContainer(
  id: string,
  type: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  data: ContainerNodeData = {}
): Node<ContainerNodeData> {
  return {
    id,
    type,
    position,
    data: { ...data, display: { ...data.display, shape: 'container' } },
    style: { width: size.width, height: size.height },
  };
}

function createChild(
  id: string,
  label: string,
  position: { x: number; y: number },
  parentId: string
): Node {
  return {
    ...createNode({ id, type: ACTIVITY_TYPE, position, display: { label } }),
    parentId,
    extent: 'parent' as const,
  };
}

interface ContainerCanvasStoryProps {
  initialNodes: Node[];
  initialEdges?: Edge[];
  additionalNodeTypes?: NodeTypes;
  title: string;
  description: string;
}

function ContainerCanvasStory({
  initialNodes,
  initialEdges = [],
  additionalNodeTypes,
  title,
  description,
}: ContainerCanvasStoryProps) {
  const reactFlow = useReactFlow();
  const handleAddNodeOnConnectEnd = useAddNodeOnConnectEnd();
  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges, additionalNodeTypes });
  const handlePaneClick = useCallback(() => removePreviewFromReactFlow(reactFlow), [reactFlow]);

  return (
    <BaseCanvas
      {...canvasProps}
      mode="design"
      deleteKeyCode={['Backspace', 'Delete']}
      onConnectEnd={handleAddNodeOnConnectEnd}
      onPaneClick={handlePaneClick}
    >
      <AddNodeManager />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel title={title} description={description} />
    </BaseCanvas>
  );
}

function PresetsStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createContainer(
        'loop',
        LOOP_TYPE,
        { x: 32, y: 128 },
        { width: 560, height: 288 },
        {
          display: { label: 'For Each claim' },
        }
      ),
      createChild('loop-child', 'Analyze claim', { x: 224, y: 128 }, 'loop'),
      createContainer(
        'error-handler',
        ERROR_HANDLER_TYPE,
        { x: 656, y: 128 },
        { width: 560, height: 288 }
      ),
      createContainer('group', GROUP_TYPE, { x: 32, y: 464 }, { width: 560, height: 288 }),
      createContainer('scope', SCOPE_TYPE, { x: 656, y: 464 }, { width: 560, height: 288 }),
    ],
    []
  );

  return (
    <ContainerCanvasStory
      initialNodes={initialNodes}
      title="Container presets"
      description="Loop keeps its mode pill. Error handler: dashed warning frame, no badge, entry-only inner handle. Group: no badge, solid body. Try: a text badge from the manifest, info accent, xl radius."
    />
  );
}

export const Presets: Story = {
  name: 'Presets',
  render: () => <PresetsStory />,
};

function ErrorHandlerStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createContainer(
        'error-handler',
        ERROR_HANDLER_TYPE,
        { x: 96, y: 160 },
        { width: 640, height: 352 }
      ),
    ],
    []
  );

  return (
    <ContainerCanvasStory
      initialNodes={initialNodes}
      title="Error handler"
      description="Configured only through display.container in the manifest. It has an inner entry handle and no return handle, so the + button adds a first step with no return edge."
    />
  );
}

export const ErrorHandler: Story = {
  name: 'Error handler',
  render: () => <ErrorHandlerStory />,
};

function GroupStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createContainer('group', GROUP_TYPE, { x: 96, y: 160 }, { width: 640, height: 352 }),
      createChild('group-child', 'Validate input', { x: 256, y: 128 }, 'group'),
    ],
    []
  );

  return (
    <ContainerCanvasStory
      initialNodes={initialNodes}
      title="Group"
      description="A container with no badge and a solid body frame."
    />
  );
}

export const Group: Story = {
  name: 'Group',
  render: () => <GroupStory />,
};

// Slot demos render ContainerNode directly so its props can be passed.
function SubtitleAndEndNode(props: NodeProps<Node<ContainerNodeData>>) {
  return (
    <ContainerNode
      {...props}
      kind="scope"
      subtitle="Commits all steps or none"
      headerEnd={<span className="text-xs text-foreground-muted">3 steps</span>}
      headerBadges={<ContainerBadge>Transaction</ContainerBadge>}
    />
  );
}

function CustomHeaderNode(props: NodeProps<Node<ContainerNodeData>>) {
  return (
    <ContainerNode
      {...props}
      kind="parallel"
      headerBadges={<ContainerBadge>3 branches</ContainerBadge>}
      renderHeader={({ icon, title, badges }) => (
        <div className="flex w-full min-w-0 items-center gap-2.5">
          {icon}
          {title}
          <span className="ml-auto">{badges}</span>
        </div>
      )}
    />
  );
}

function CustomEmptyStateNode(props: NodeProps<Node<ContainerNodeData>>) {
  return (
    <ContainerNode
      {...props}
      kind="scope"
      headerBadges={null}
      appearance={{ borderStyle: 'dashed' }}
      bodyFrame="none"
      onAddFirstChild={() => undefined}
      renderEmptyState={({ onAddFirstChild }) => (
        <button
          type="button"
          onClick={onAddFirstChild}
          className="nodrag nopan flex items-center gap-2 rounded-xl border border-border bg-surface-overlay px-3 py-2 text-sm text-foreground hover:border-brand"
        >
          <CanvasIcon icon="plus" size={14} />
          Add the first step
        </button>
      )}
    />
  );
}

function CustomLabelNode(props: NodeProps<Node<ContainerNodeData>>) {
  return (
    <ContainerNode
      {...props}
      kind="scope"
      emptyStateLabel="Add a step to retry"
      onAddFirstChild={() => undefined}
    />
  );
}

const slotNodeTypes: NodeTypes = {
  [SLOT_TYPES[0]]: SubtitleAndEndNode,
  [SLOT_TYPES[1]]: CustomHeaderNode,
  [SLOT_TYPES[2]]: CustomEmptyStateNode,
  [SLOT_TYPES[3]]: CustomLabelNode,
};

function SlotsStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createContainer(
        'subtitle',
        'story.slot.subtitle',
        { x: 32, y: 128 },
        { width: 560, height: 288 },
        { display: { label: 'subtitle, headerEnd, headerBadges' } }
      ),
      createContainer(
        'header',
        'story.slot.header',
        { x: 656, y: 128 },
        { width: 560, height: 288 },
        { display: { label: 'renderHeader' } }
      ),
      createContainer(
        'empty',
        'story.slot.empty-state',
        { x: 32, y: 464 },
        { width: 560, height: 288 },
        { display: { label: 'renderEmptyState' } }
      ),
      createContainer(
        'label',
        'story.slot.label',
        { x: 656, y: 464 },
        { width: 560, height: 288 },
        { display: { label: 'emptyStateLabel' } }
      ),
    ],
    []
  );

  return (
    <ContainerCanvasStory
      initialNodes={initialNodes}
      additionalNodeTypes={slotNodeTypes}
      title="Slots"
      description="Each container shows one set of ContainerNode props. Hover the + button on the last one to see the custom empty-state label."
    />
  );
}

export const Slots: Story = {
  name: 'Slots',
  render: () => <SlotsStory />,
};

function EditableLoopNode(props: NodeProps<Node<ContainerNodeData>>) {
  return <LoopNode {...props} labelEditable />;
}

const editableNodeTypes: NodeTypes = { 'story.editable.loop': EditableLoopNode };

function InlineEditingStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createContainer('editable', EDITABLE_TYPE, { x: 32, y: 128 }, { width: 560, height: 288 }),
      createContainer(
        'editable-loop',
        'story.editable.loop',
        { x: 656, y: 128 },
        { width: 560, height: 288 },
        { display: { label: 'For Each claim' } }
      ),
    ],
    []
  );

  return (
    <ContainerCanvasStory
      initialNodes={initialNodes}
      additionalNodeTypes={editableNodeTypes}
      title="Inline editing"
      description="Select a container, then double-click its title or subtitle to rename it. Enter saves, Escape cancels. Off by default: the left container turns it on with labelEditable in its manifest, the loop with the labelEditable prop."
    />
  );
}

export const InlineEditing: Story = {
  name: 'Inline editing',
  render: () => <InlineEditingStory />,
};
