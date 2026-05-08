import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type Edge,
  type Node,
  Panel,
  Position,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAddNodeOnConnectEnd, useCanvasEvent } from '../../hooks';
import { createNode, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import type { CanvasHandleActionEvent } from '../../utils';
import { removePreviewFromReactFlow } from '../../utils/createPreviewNode';
import { snapToGrid } from '../../utils/NodeUtils';
import { AddNodeManager } from '../AddNodePanel';
import { createAddNodePreview } from '../AddNodePanel/createAddNodePreview';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import type { LoopNodeData } from './LoopNode.types';

const meta: Meta = {
  title: 'Canvas/LoopNode',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const LOOP_TYPE = 'uipath.control-flow.foreach';
const ACTIVITY_TYPE = 'uipath.blank-node';
const STORY_LOOP_START_HANDLE_ID = 'start';
const STORY_LOOP_CONTINUE_HANDLE_ID = 'continue';
const STORY_LOOP_SUCCESS_HANDLE_ID = 'success';

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
  options?: { parentId?: string; selected?: boolean; data?: LoopNodeData }
): Node<LoopNodeData> {
  const snappedSize = snapSize(size);
  const display = {
    ...options?.data?.display,
    shape: 'container' as const,
  };

  return {
    id,
    type: LOOP_TYPE,
    position: snapPoint(position),
    parentId: options?.parentId,
    selected: options?.selected ?? false,
    data: {
      ...options?.data,
      display,
    },
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
    };
  }

  return node;
}

interface AutoPreviewSource {
  nodeId: string;
  handleId: string;
  position?: Position;
}

interface LoopCanvasStoryProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  autoPreviewSource?: AutoPreviewSource;
}

function LoopCanvasStory({ initialNodes, initialEdges, autoPreviewSource }: LoopCanvasStoryProps) {
  const reactFlow = useReactFlow();
  const handleAddNodeOnConnectEnd = useAddNodeOnConnectEnd();
  const autoPreviewedRef = useRef(false);

  const { canvasProps, nodeTypeRegistry } = useCanvasStory({
    initialNodes,
    initialEdges,
  });

  const loopPreviewOptions = useMemo(
    () => ({
      getManifestForNode: (node: Node) =>
        node.type ? nodeTypeRegistry.getManifest(node.type) : undefined,
    }),
    [nodeTypeRegistry]
  );

  useEffect(() => {
    if (!autoPreviewSource || autoPreviewedRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      if (autoPreviewedRef.current) return;

      autoPreviewedRef.current = true;
      createAddNodePreview(
        autoPreviewSource.nodeId,
        autoPreviewSource.handleId,
        reactFlow,
        autoPreviewSource.position ?? Position.Right,
        'source',
        [],
        loopPreviewOptions
      );
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [autoPreviewSource, loopPreviewOptions, reactFlow]);

  const handleHandleAction = useCallback(
    (event: CanvasHandleActionEvent) => {
      const { handleId, nodeId, position, handleType } = event;
      if (!handleId || !nodeId) return;

      createAddNodePreview(
        nodeId,
        handleId,
        reactFlow,
        position as Position,
        handleType === 'input' ? 'target' : 'source',
        [],
        loopPreviewOptions
      );
    },
    [loopPreviewOptions, reactFlow]
  );

  useCanvasEvent('handle:action', handleHandleAction);

  const handlePaneClick = useCallback(() => {
    removePreviewFromReactFlow(reactFlow);
  }, [reactFlow]);

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
    </BaseCanvas>
  );
}

function DefaultStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createActivityNode('ingress', 'Load records', { x: 32, y: 256 }),
      createLoopContainerNode(
        'loop-1',
        { x: 224, y: 128 },
        { width: 704, height: 368 },
        {
          selected: true,
          data: { display: { label: 'For Each claim' } },
        }
      ),
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
      },
      {
        id: 'child-1-child-2',
        source: 'child-1',
        sourceHandle: 'output',
        target: 'child-2',
        targetHandle: 'input',
      },
      {
        id: 'child-2-loop',
        source: 'child-2',
        sourceHandle: 'output',
        target: 'loop-1',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
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

  return <LoopCanvasStory initialNodes={initialNodes} initialEdges={initialEdges} />;
}

function NestedOuterOutputInsertStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createActivityNode('ingress', 'Load records', { x: 32, y: 288 }),
      createLoopContainerNode(
        'outer-loop',
        { x: 192, y: 80 },
        { width: 1040, height: 496 },
        {
          selected: true,
          data: { display: { label: 'For Each claim' } },
        }
      ),
      createLoopContainerNode(
        'inner-loop',
        { x: 128, y: 112 },
        { width: 496, height: 304 },
        {
          parentId: 'outer-loop',
          data: { display: { label: 'For Each attachment' } },
        }
      ),
      createActivityNode(
        'inner-child',
        'Classify attachment',
        { x: 176, y: 112 },
        { parentId: 'inner-loop' }
      ),
      createActivityNode(
        'review',
        'Review finding',
        { x: 720, y: 216 },
        { parentId: 'outer-loop' }
      ),
      createActivityNode('egress', 'Publish results', { x: 1296, y: 288 }),
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'ingress-outer-loop',
        source: 'ingress',
        sourceHandle: 'output',
        target: 'outer-loop',
        targetHandle: 'input',
      },
      {
        id: 'outer-loop-inner-loop',
        source: 'outer-loop',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'inner-loop',
        targetHandle: 'input',
      },
      {
        id: 'inner-loop-inner-child',
        source: 'inner-loop',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'inner-child',
        targetHandle: 'input',
      },
      {
        id: 'inner-child-inner-loop',
        source: 'inner-child',
        sourceHandle: 'output',
        target: 'inner-loop',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
      },
      {
        id: 'inner-loop-review',
        source: 'inner-loop',
        sourceHandle: STORY_LOOP_SUCCESS_HANDLE_ID,
        target: 'review',
        targetHandle: 'input',
      },
      {
        id: 'review-outer-loop',
        source: 'review',
        sourceHandle: 'output',
        target: 'outer-loop',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
      },
      {
        id: 'outer-loop-egress',
        source: 'outer-loop',
        sourceHandle: STORY_LOOP_SUCCESS_HANDLE_ID,
        target: 'egress',
        targetHandle: 'input',
      },
    ],
    []
  );

  return (
    <LoopCanvasStory
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      autoPreviewSource={{
        nodeId: 'inner-loop',
        handleId: STORY_LOOP_SUCCESS_HANDLE_ID,
        position: Position.Right,
      }}
    />
  );
}

function NestedOuterOutputAppendStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createActivityNode('ingress', 'Load records', { x: 32, y: 272 }),
      createLoopContainerNode(
        'outer-loop',
        { x: 224, y: 96 },
        { width: 896, height: 448 },
        {
          selected: true,
          data: { display: { label: 'For Each claim' } },
        }
      ),
      createLoopContainerNode(
        'inner-loop',
        { x: 160, y: 112 },
        { width: 544, height: 304 },
        {
          parentId: 'outer-loop',
          data: { display: { label: 'For Each attachment' } },
        }
      ),
      createActivityNode(
        'inner-child',
        'Classify attachment',
        { x: 176, y: 112 },
        { parentId: 'inner-loop' }
      ),
      createActivityNode('egress', 'Publish results', { x: 1216, y: 272 }),
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'ingress-outer-loop',
        source: 'ingress',
        sourceHandle: 'output',
        target: 'outer-loop',
        targetHandle: 'input',
      },
      {
        id: 'outer-loop-inner-loop',
        source: 'outer-loop',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'inner-loop',
        targetHandle: 'input',
      },
      {
        id: 'inner-loop-inner-child',
        source: 'inner-loop',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'inner-child',
        targetHandle: 'input',
      },
      {
        id: 'inner-child-inner-loop',
        source: 'inner-child',
        sourceHandle: 'output',
        target: 'inner-loop',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
      },
      {
        id: 'outer-loop-egress',
        source: 'outer-loop',
        sourceHandle: STORY_LOOP_SUCCESS_HANDLE_ID,
        target: 'egress',
        targetHandle: 'input',
      },
    ],
    []
  );

  return (
    <LoopCanvasStory
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      autoPreviewSource={{
        nodeId: 'inner-loop',
        handleId: STORY_LOOP_SUCCESS_HANDLE_ID,
        position: Position.Right,
      }}
    />
  );
}

export const Default: Story = {
  render: () => <DefaultStory />,
};

export const NestedOuterOutputInsert: Story = {
  render: () => <NestedOuterOutputInsertStory />,
};

export const NestedOuterOutputAppend: Story = {
  render: () => <NestedOuterOutputAppendStory />,
};
