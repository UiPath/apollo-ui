import type { Meta, StoryObj } from '@storybook/react-vite';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { BackgroundVariant, Panel, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uipath/apollo-wind';
import { useMemo, useRef, useState } from 'react';
import {
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { BaseCanvas } from './BaseCanvas';
import type { BaseCanvasRef } from './BaseCanvas.types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof BaseCanvas> = {
  title: 'Canvas/BaseCanvas',
  decorators: [withCanvasProviders()],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    mode: { control: { type: 'select' }, options: ['design', 'view', 'readonly'] },
    defaultEdgeOptions: { control: { type: 'object' } },
    backgroundColor: { control: { type: 'color' } },
    backgroundVariant: { control: { type: 'select' }, options: ['dots', 'lines', 'cross'] },
    backgroundGap: { control: { type: 'number' } },
    backgroundSize: { control: { type: 'number' } },
    minZoom: { control: { type: 'number', min: 0.1, max: 1, step: 0.1 } },
    maxZoom: { control: { type: 'number', min: 1, max: 10, step: 0.5 } },
    onNodesChange: { control: false },
    onEdgesChange: { control: false },
    onConnect: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Shared Data
// ============================================================================

function createPipelineNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'source',
      type: 'uipath.blank-node',
      position: { x: 50, y: 200 },
      display: { label: 'Data Source', subLabel: 'Input Stream', icon: 'cloud-upload' },
    }),
    createNode({
      id: 'processor1',
      type: 'uipath.blank-node',
      position: { x: 300, y: 100 },
      display: { label: 'Transform', subLabel: 'Data Processing', icon: 'settings' },
    }),
    createNode({
      id: 'processor2',
      type: 'uipath.blank-node',
      position: { x: 300, y: 300 },
      display: { label: 'Filter', subLabel: 'Validation Rules', icon: 'list-filter' },
    }),
    createNode({
      id: 'merger',
      type: 'uipath.blank-node',
      position: { x: 550, y: 200 },
      display: { label: 'Merge', subLabel: 'Combine Streams', icon: 'git-merge' },
    }),
    createNode({
      id: 'output',
      type: 'uipath.blank-node',
      position: { x: 800, y: 200 },
      display: { label: 'Storage', subLabel: 'Database', icon: 'database' },
    }),
    createNode({
      id: 'monitor',
      type: 'uipath.blank-node',
      position: { x: 1050, y: 200 },
      display: { label: 'Monitor', subLabel: 'Analytics', icon: 'chart-bar-big' },
    }),
  ];
}

const pipelineEdges: Edge[] = [
  {
    id: 'e-source-p1',
    source: 'source',
    sourceHandle: 'output',
    target: 'processor1',
    targetHandle: 'input',
  },
  {
    id: 'e-source-p2',
    source: 'source',
    sourceHandle: 'output',
    target: 'processor2',
    targetHandle: 'input',
  },
  {
    id: 'e-p1-merger',
    source: 'processor1',
    sourceHandle: 'output',
    target: 'merger',
    targetHandle: 'input',
  },
  {
    id: 'e-p2-merger',
    source: 'processor2',
    sourceHandle: 'output',
    target: 'merger',
    targetHandle: 'input',
  },
  {
    id: 'e-merger-output',
    source: 'merger',
    sourceHandle: 'output',
    target: 'output',
    targetHandle: 'input',
  },
  {
    id: 'e-output-monitor',
    source: 'output',
    sourceHandle: 'output',
    target: 'monitor',
    targetHandle: 'input',
  },
];

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo(() => createPipelineNodes(), []);
  const [defaultEdgeType, setDefaultEdgeType] = useState('default');
  const [animated, setAnimated] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [mode, setMode] = useState<'design' | 'view' | 'readonly'>('design');

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges: pipelineEdges });

  return (
    <BaseCanvas
      {...canvasProps}
      mode={mode}
      defaultEdgeOptions={{
        type: defaultEdgeType === 'default' ? undefined : defaultEdgeType,
        animated,
        style: { strokeWidth },
      }}
    >
      <StoryInfoPanel title="Canvas configuration" collapsible defaultCollapsed>
        <Column gap={12} style={{ marginTop: 12, minWidth: 240 }}>
          <Column gap={8}>
            <span className="text-base">Mode:</span>
            <Row gap={8}>
              {(['design', 'view', 'readonly'] as const).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={mode === m ? 'default' : 'secondary'}
                  onClick={() => setMode(m)}
                >
                  {m}
                </Button>
              ))}
            </Row>
            <span className="text-xs" style={{ fontStyle: 'italic' }}>
              {mode === 'design' && 'Full editing capabilities'}
              {mode === 'view' && 'Interactive viewing (pan, zoom, select, click)'}
              {mode === 'readonly' && 'No interactions allowed'}
            </span>
          </Column>

          <Select value={defaultEdgeType} onValueChange={setDefaultEdgeType}>
            <SelectTrigger>
              <SelectValue placeholder="Edge type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (Bezier)</SelectItem>
              <SelectItem value="straight">Straight</SelectItem>
              <SelectItem value="step">Step</SelectItem>
              <SelectItem value="smoothstep">Smooth Step</SelectItem>
              <SelectItem value="bezier">Bezier</SelectItem>
            </SelectContent>
          </Select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={animated}
              onChange={(e) => setAnimated(e.target.checked)}
            />
            Animated Edges
          </label>

          <Column gap={8}>
            <span className="text-base">Stroke Width: {strokeWidth}px</span>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </Column>
        </Column>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function DifferentBackgroundsStory() {
  const initialNodes = useMemo(() => createPipelineNodes(), []);
  const [backgroundType, setBackgroundType] = useState<BackgroundVariant>(BackgroundVariant.Lines);

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges: pipelineEdges });

  const bgProps = {
    [BackgroundVariant.Dots]: { gap: 16, size: 2 },
    [BackgroundVariant.Cross]: { gap: 16, size: 4 },
    [BackgroundVariant.Lines]: { gap: 16, size: 1 },
  }[backgroundType];

  return (
    <BaseCanvas
      {...canvasProps}
      mode="view"
      backgroundVariant={backgroundType}
      backgroundGap={bgProps.gap}
      backgroundSize={bgProps.size}
    >
      <StoryInfoPanel title="Background variants">
        <Row gap={8} style={{ marginTop: 8 }}>
          {[BackgroundVariant.Dots, BackgroundVariant.Lines, BackgroundVariant.Cross].map(
            (variant) => (
              <Button
                key={variant}
                size="sm"
                variant={backgroundType === variant ? 'default' : 'secondary'}
                onClick={() => setBackgroundType(variant)}
              >
                {variant}
              </Button>
            )
          )}
        </Row>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function ReadOnlyModeStory() {
  const initialNodes = useMemo(() => createPipelineNodes(), []);
  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges: pipelineEdges });

  return (
    <BaseCanvas {...canvasProps} mode="readonly">
      <StoryInfoPanel
        title="Read-only mode"
        description="Interactions are disabled. Canvas cannot be panned, zoomed, or edited."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function EmptyCanvasStory() {
  const [nodeCount, setNodeCount] = useState(0);
  const { nodes, setNodes, edges, canvasProps } = useCanvasStory({ initialNodes: [] });

  const addNode = () => {
    const newNode = createNode({
      id: `node-${nodeCount + 1}`,
      type: 'uipath.blank-node',
      position: { x: 100 + (nodeCount % 3) * 200, y: 100 + Math.floor(nodeCount / 3) * 150 },
      display: { label: `Node ${nodeCount + 1}`, subLabel: 'Click to configure', icon: 'plus' },
    });
    setNodes((nds) => [...nds, newNode]);
    setNodeCount((c) => c + 1);
  };

  const clearCanvas = () => {
    setNodes([]);
    setNodeCount(0);
  };

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel title="Canvas actions">
        <Column gap={8} style={{ marginTop: 8 }}>
          <Button onClick={addNode} size="sm">
            Add Node
          </Button>
          <Button onClick={clearCanvas} size="sm" variant="secondary" disabled={nodes.length === 0}>
            Clear Canvas
          </Button>
          <span className="text-sm">
            Nodes: {nodes.length}, Edges: {edges.length}
          </span>
        </Column>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function WithNodeFocusControlsStory() {
  const canvasRef = useRef<BaseCanvasRef>(null);

  const initialNodes = useMemo(
    () => [
      createNode({
        id: '1',
        type: 'uipath.blank-node',
        position: { x: 100, y: 100 },
        display: { label: 'Node 1', subLabel: 'Top Left', icon: 'circle' },
      }),
      createNode({
        id: '2',
        type: 'uipath.blank-node',
        position: { x: 800, y: 100 },
        display: { label: 'Node 2', subLabel: 'Top Right', icon: 'circle' },
      }),
      createNode({
        id: '3',
        type: 'uipath.blank-node',
        position: { x: 100, y: 600 },
        display: { label: 'Node 3', subLabel: 'Bottom Left', icon: 'circle' },
      }),
      createNode({
        id: '4',
        type: 'uipath.blank-node',
        position: { x: 800, y: 600 },
        display: { label: 'Node 4', subLabel: 'Bottom Right', icon: 'circle' },
      }),
      createNode({
        id: '5',
        type: 'uipath.blank-node',
        position: { x: 450, y: 350 },
        display: { label: 'Center Node', subLabel: 'Hub', icon: 'target' },
        handleConfigurations: [
          {
            position: Position.Top,
            handles: [
              { id: 'in1', type: 'target', handleType: 'input' },
              { id: 'in2', type: 'target', handleType: 'input' },
            ],
          },
          {
            position: Position.Bottom,
            handles: [
              { id: 'in3', type: 'target', handleType: 'input' },
              { id: 'in4', type: 'target', handleType: 'input' },
            ],
          },
        ],
      }),
    ],
    []
  );

  const initialEdges: Edge[] = [
    { id: 'e1-5', source: '1', sourceHandle: 'output', target: '5', targetHandle: 'in1' },
    { id: 'e2-5', source: '2', sourceHandle: 'output', target: '5', targetHandle: 'in2' },
    { id: 'e3-5', source: '3', sourceHandle: 'output', target: '5', targetHandle: 'in3' },
    { id: 'e4-5', source: '4', sourceHandle: 'output', target: '5', targetHandle: 'in4' },
  ];

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas ref={canvasRef} {...canvasProps} mode="view">
      <StoryInfoPanel title="Focus controls">
        <Column gap={8} style={{ marginTop: 8 }}>
          <Button size="sm" onClick={() => canvasRef.current?.ensureNodesInView(['1'])}>
            Focus Node 1
          </Button>
          <Button size="sm" onClick={() => canvasRef.current?.ensureNodesInView(['2'])}>
            Focus Node 2
          </Button>
          <Button size="sm" onClick={() => canvasRef.current?.ensureNodesInView(['3', '4'])}>
            Focus Nodes 3 & 4
          </Button>
          <Button size="sm" onClick={() => canvasRef.current?.centerNode('5')}>
            Center on Node 5
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => canvasRef.current?.ensureAllNodesInView()}
          >
            Show All Nodes
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => canvasRef.current?.ensureNodesInView(['1', '2'], { maintainZoom: true })}
          >
            Focus 1 & 2 (Keep Zoom)
          </Button>
        </Column>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls orientation="vertical" translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function WithMaintainNodesInViewStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'important-1',
        type: 'uipath.blank-node',
        position: { x: 100, y: 100 },
        display: { label: 'Important Node 1', subLabel: 'Keep in view', icon: 'star' },
      }),
      createNode({
        id: 'important-2',
        type: 'uipath.blank-node',
        position: { x: 300, y: 100 },
        display: { label: 'Important Node 2', subLabel: 'Keep in view', icon: 'star' },
      }),
      createNode({
        id: 'other-1',
        type: 'uipath.blank-node',
        position: { x: 500, y: 200 },
        display: { label: 'Other Node 1', icon: 'square' },
      }),
      createNode({
        id: 'other-2',
        type: 'uipath.blank-node',
        position: { x: 100, y: 300 },
        display: { label: 'Other Node 2', icon: 'square' },
      }),
    ],
    []
  );

  const initialEdges: Edge[] = [
    {
      id: 'e1-2',
      source: 'important-1',
      sourceHandle: 'output',
      target: 'important-2',
      targetHandle: 'input',
    },
    {
      id: 'e2-3',
      source: 'important-2',
      sourceHandle: 'output',
      target: 'other-1',
      targetHandle: 'input',
    },
    {
      id: 'e1-4',
      source: 'important-1',
      sourceHandle: 'output',
      target: 'other-2',
      targetHandle: 'input',
    },
  ];

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  const [maintainNodes, setMaintainNodes] = useState<string[] | undefined>([
    'important-1',
    'important-2',
  ]);
  const [containerSize, setContainerSize] = useState({ width: '100%', height: '100%' });

  const cycleMaintainMode = () => {
    setMaintainNodes((current) => {
      if (current === undefined) return ['important-1', 'important-2'];
      if (current.length > 0) return [];
      return undefined;
    });
  };

  const getMaintainModeLabel = () => {
    if (maintainNodes === undefined) return 'Disabled';
    if (maintainNodes.length > 0) return 'Specific Nodes';
    return 'All Nodes';
  };

  return (
    <Column h="100%">
      <Column
        gap={8}
        p={20}
        style={{
          color: 'var(--uix-canvas-foreground)',
          backgroundColor: 'var(--uix-canvas-background-secondary)',
        }}
      >
        <span className="text-lg font-bold">Maintain Nodes in View Demo</span>
        <span className="text-base">
          Resize the container to see how important nodes stay in view
        </span>
        <Row gap={8} align="center">
          <Button onClick={() => setContainerSize({ width: '400px', height: '300px' })} size="sm">
            Small
          </Button>
          <Button onClick={() => setContainerSize({ width: '600px', height: '400px' })} size="sm">
            Medium
          </Button>
          <Button onClick={() => setContainerSize({ width: '100%', height: '100%' })} size="sm">
            Large
          </Button>
          <Button
            onClick={cycleMaintainMode}
            size="sm"
            variant={maintainNodes !== undefined ? 'default' : 'secondary'}
          >
            {getMaintainModeLabel()}
          </Button>
        </Row>
        {maintainNodes !== undefined && (
          <span className="text-sm">
            {maintainNodes.length > 0
              ? `Maintaining nodes: ${maintainNodes.join(', ')}`
              : 'Maintaining all nodes in view'}
          </span>
        )}
      </Column>
      <div
        style={{
          flex: 1,
          border: '1px solid var(--uix-canvas-border)',
          transition: 'all 0.3s ease',
          ...containerSize,
        }}
      >
        <BaseCanvas {...canvasProps} mode="view" maintainNodesInView={maintainNodes}>
          <Panel position="bottom-right">
            <CanvasPositionControls
              orientation="vertical"
              translations={DefaultCanvasTranslations}
            />
          </Panel>
        </BaseCanvas>
      </div>
    </Column>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  render: () => <DefaultStory />,
};

export const DifferentBackgrounds: Story = {
  render: () => <DifferentBackgroundsStory />,
};

export const ReadOnlyMode: Story = {
  render: () => <ReadOnlyModeStory />,
};

export const EmptyCanvas: Story = {
  render: () => <EmptyCanvasStory />,
};

export const WithNodeFocusControls: Story = {
  render: () => <WithNodeFocusControlsStory />,
};

export const WithMaintainNodesInView: Story = {
  render: () => <WithMaintainNodesInViewStory />,
};
