import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type Edge,
  type Node,
  type NodeProps,
  Panel,
  Position,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo } from 'react';
import { PREVIEW_NODE_ID } from '../../constants';
import { useOptionalNodeTypeRegistry } from '../../core';
import { useCanvasEvent } from '../../hooks';
import {
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { removePreviewFromReactFlow, showPreviewGraph } from '../../utils/createPreviewGraph';
import { snapToGrid } from '../../utils/NodeUtils';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { LoopCanvasNode } from './LoopCanvasNode';
import { LoopNode } from './LoopNode';
import { DEFAULT_LOOP_NODE_TYPE, DEFAULT_LOOP_TITLE } from './LoopNode.constants';
import { resolveLoopPreviewConnectionHandles } from './LoopNode.helpers';
import type { LoopNodeData, LoopNodeProps } from './LoopNode.types';
import { showCenteredContainerPreview } from './LoopNodePreview';

const meta: Meta = {
  title: 'Canvas/LoopNode',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const LOOP_TYPE = DEFAULT_LOOP_NODE_TYPE;
const ACTIVITY_TYPE = 'uipath.blank-node';
const LOOP_PREVIEW_EDGE_DATA = { parentId: 'loop-1' };
const STORY_LOOP_START_HANDLE_ID = 'start';
const STORY_LOOP_CONTINUE_HANDLE_ID = 'continue';
const snapPoint = (point: { x: number; y: number }) => ({
  x: snapToGrid(point.x),
  y: snapToGrid(point.y),
});
const snapSize = (size: { width: number; height: number }) => ({
  width: snapToGrid(size.width),
  height: snapToGrid(size.height),
});

function createLoopContainerNode(
  id: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  options?: { selected?: boolean; data?: LoopNodeData }
): Node<LoopNodeData> {
  const snappedPosition = snapPoint(position);
  const snappedSize = snapSize(size);

  return {
    id,
    type: LOOP_TYPE,
    position: snappedPosition,
    selected: options?.selected ?? false,
    data: options?.data ?? {},
    style: { width: snappedSize.width, height: snappedSize.height },
  };
}

function createActivityNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  options?: { parentId?: string; subLabel?: string | null }
): Node<BaseNodeData> {
  const node = createNode({
    id,
    type: ACTIVITY_TYPE,
    position: snapPoint(position),
    display: options?.subLabel ? { label, subLabel: options.subLabel } : { label },
  });

  if (options?.parentId) {
    return {
      ...node,
      parentId: options.parentId,
      extent: 'parent',
    };
  }

  return node;
}

function LoopModePill() {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-(--canvas-border) bg-(--canvas-background) px-2.5 py-[5px] text-[13px] font-semibold leading-none text-(--canvas-foreground) shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
      <span className="inline-flex text-(--canvas-foreground-de-emp)" aria-hidden>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 3.5H12M2 7H12M2 10.5H12"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>Sequential</span>
    </div>
  );
}

function createConfiguredLoopNodeType(config: { centeredPreviewOnAdd?: boolean }) {
  return function StoryLoopNode(props: NodeProps<Node<LoopNodeData>>) {
    const reactFlow = useReactFlow();
    const nodeTypeRegistry = useOptionalNodeTypeRegistry();
    const nodeVersion = typeof props.data?.version === 'string' ? props.data.version : undefined;
    const loopManifest = nodeTypeRegistry?.getManifest(props.type ?? LOOP_TYPE, nodeVersion);
    const loopPreviewHandles = resolveLoopPreviewConnectionHandles(loopManifest, {
      ...(props.data ?? {}),
      nodeId: props.id,
    });

    const handleAddFirstChild = useCallback<NonNullable<LoopNodeProps['onAddFirstChild']>>(() => {
      if (!config.centeredPreviewOnAdd || !loopPreviewHandles) return;

      removePreviewFromReactFlow(reactFlow);
      showCenteredContainerPreview({
        containerId: props.id,
        reactFlowInstance: reactFlow,
        previewHandles: loopPreviewHandles,
        trailingEdgeId: `${PREVIEW_NODE_ID}-${props.id}-${loopPreviewHandles.targetHandleId}`,
      });
    }, [config.centeredPreviewOnAdd, loopPreviewHandles, props.id, reactFlow]);

    return (
      <div className="relative h-full w-full">
        <LoopNode
          {...props}
          onAddFirstChild={
            config.centeredPreviewOnAdd && loopPreviewHandles ? handleAddFirstChild : undefined
          }
        />
        <div className="pointer-events-none absolute right-3 top-3 z-10">
          <LoopModePill />
        </div>
      </div>
    );
  };
}

const CenteredPreviewLoopNode = createConfiguredLoopNodeType({
  centeredPreviewOnAdd: true,
});

const ConnectedLoopNode = createConfiguredLoopNodeType({});

function useLoopHandleAddPreview(loopId: string) {
  const reactFlow = useReactFlow();

  useCanvasEvent('handle:action', (event) => {
    if (event.nodeId !== loopId) return;
    showPreviewGraph({
      sourceNodeId: event.nodeId,
      sourceHandleId: event.handleId,
      reactFlowInstance: reactFlow,
      sourceHandleType: event.handleType === 'input' ? 'target' : 'source',
      handlePosition: event.position as Position,
    });
  });

  return useCallback(() => {
    removePreviewFromReactFlow(reactFlow);
  }, [reactFlow]);
}

function EmptyStatePreviewStory() {
  const reactFlow = useReactFlow();
  const initialNodes = useMemo<Node[]>(
    () => [createLoopContainerNode('loop-1', { x: 144, y: 112 }, { width: 720, height: 432 })],
    []
  );

  const { canvasProps } = useCanvasStory({
    initialNodes,
    additionalNodeTypes: { [LOOP_TYPE]: CenteredPreviewLoopNode },
  });

  const handlePaneClick = useCallback(() => {
    removePreviewFromReactFlow(reactFlow);
  }, [reactFlow]);

  return (
    <BaseCanvas {...canvasProps} mode="design" onPaneClick={handlePaneClick}>
      <StoryInfoPanel
        title="Empty Loop With Centered Preview"
        description="Click the inner + to create a centered preview ghost inside the empty loop body. Click the canvas background to clear it."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const EmptyStatePreview: Story = {
  render: () => <EmptyStatePreviewStory />,
};

function ConnectedChildrenStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createActivityNode('ingress', 'Load records', { x: 32, y: 256 }),
      createLoopContainerNode('loop-1', { x: 224, y: 128 }, { width: 704, height: 368 }),
      createActivityNode('child-1', 'Analyze claims', { x: 160, y: 96 }, { parentId: 'loop-1' }),
      createActivityNode('child-2', 'Write outcome', { x: 432, y: 96 }, { parentId: 'loop-1' }),
      createActivityNode('egress', 'Publish results', { x: 1024, y: 256 }),
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'ingress-loop',
        source: 'ingress',
        sourceHandle: 'output',
        target: 'loop-1',
        targetHandle: 'input',
      },
      {
        id: 'loop-child-1',
        source: 'loop-1',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'child-1',
        targetHandle: 'input',
        data: LOOP_PREVIEW_EDGE_DATA,
      },
      {
        id: 'child-1-child-2',
        source: 'child-1',
        sourceHandle: 'output',
        target: 'child-2',
        targetHandle: 'input',
        data: LOOP_PREVIEW_EDGE_DATA,
      },
      {
        id: 'child-2-loop',
        source: 'child-2',
        sourceHandle: 'output',
        target: 'loop-1',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
        data: LOOP_PREVIEW_EDGE_DATA,
      },
      {
        id: 'loop-egress',
        source: 'loop-1',
        sourceHandle: 'success',
        target: 'egress',
        targetHandle: 'input',
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes: { [LOOP_TYPE]: ConnectedLoopNode },
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel
        title="Loop With Connected Children"
        description="Representative fixture with outer ingress/egress edges and inner loop connections rendered against real child nodes."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const WithConnectedChildren: Story = {
  render: () => <ConnectedChildrenStory />,
};

function SelectedLoopWithChildStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createLoopContainerNode(
        'loop-1',
        { x: 112, y: 80 },
        { width: 768, height: 464 },
        { selected: true, data: { display: { label: DEFAULT_LOOP_TITLE } } }
      ),
      createActivityNode(
        'child-1',
        'Analyze claims data',
        { x: 256, y: 128 },
        {
          parentId: 'loop-1',
          subLabel: null,
        }
      ),
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'loop-child-1',
        source: 'loop-1',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'child-1',
        targetHandle: 'input',
        data: LOOP_PREVIEW_EDGE_DATA,
      },
      {
        id: 'child-1-loop',
        source: 'child-1',
        sourceHandle: 'output',
        target: 'loop-1',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
        data: LOOP_PREVIEW_EDGE_DATA,
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes: { [LOOP_TYPE]: ConnectedLoopNode },
  });

  const handlePaneClick = useLoopHandleAddPreview('loop-1');

  return (
    <BaseCanvas {...canvasProps} mode="design" onPaneClick={handlePaneClick}>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const SelectedLoopWithChild: Story = {
  render: () => <SelectedLoopWithChildStory />,
};

function VersionAwareLoopRenderingStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createNode({
        id: 'loop-v1',
        type: LOOP_TYPE,
        position: snapPoint({ x: 176, y: 264 }),
        data: {
          version: '1.0.0',
          display: {
            label: 'For Each v1',
          },
        },
      }),
      createLoopContainerNode(
        'loop-v2',
        { x: 432, y: 88 },
        { width: 720, height: 408 },
        {
          data: {
            version: '2.0.0',
            display: {
              label: 'For Each v2',
            },
          },
        }
      ),
      createActivityNode(
        'loop-v2-child-1',
        'Analyze claims',
        { x: 148, y: 104 },
        { parentId: 'loop-v2' }
      ),
      createActivityNode(
        'loop-v2-child-2',
        'Write outcome',
        { x: 436, y: 104 },
        { parentId: 'loop-v2' }
      ),
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'loop-v2-child-1',
        source: 'loop-v2',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'loop-v2-child-1',
        targetHandle: 'input',
        data: { parentId: 'loop-v2' },
      },
      {
        id: 'child-1-child-2',
        source: 'loop-v2-child-1',
        sourceHandle: 'output',
        target: 'loop-v2-child-2',
        targetHandle: 'input',
        data: { parentId: 'loop-v2' },
      },
      {
        id: 'child-2-loop-v2',
        source: 'loop-v2-child-2',
        sourceHandle: 'output',
        target: 'loop-v2',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
        data: { parentId: 'loop-v2' },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes: { [LOOP_TYPE]: LoopCanvasNode },
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel
        title="Version Aware Loop Rendering"
        description="The same `uipath.control-flow.foreach` node type renders as a regular BaseNode for v1 manifests and as the loop-container UI for v2 manifests."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const VersionAwareRendering: Story = {
  render: () => <VersionAwareLoopRenderingStory />,
};

function ExecutionAdornmentsStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createLoopContainerNode('loop-1', { x: 136, y: 88 }, { width: 760, height: 432 }),
      createActivityNode(
        'child-1',
        'Analyze claims data',
        { x: 264, y: 128 },
        { parentId: 'loop-1' }
      ),
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'loop-child-1',
        source: 'loop-1',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'child-1',
        targetHandle: 'input',
        data: LOOP_PREVIEW_EDGE_DATA,
      },
      {
        id: 'child-1-loop',
        source: 'child-1',
        sourceHandle: 'output',
        target: 'loop-1',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
        data: LOOP_PREVIEW_EDGE_DATA,
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes: { [LOOP_TYPE]: ConnectedLoopNode },
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel
        title="Loop Execution Adornments"
        description="Shows the two loop-container adornments that make sense in practice: breakpoint at top-left and execution status at top-right."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const ExecutionAdornments: Story = {
  decorators: [
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: (nodeId: string) =>
          nodeId === 'loop-1' ? { status: 'Completed' as const, debug: true, count: 1 } : undefined,
        getEdgeExecutionState: () => undefined,
      },
      validationState: {
        getElementValidationState: () => undefined,
      },
    }),
  ],
  render: () => <ExecutionAdornmentsStory />,
};
