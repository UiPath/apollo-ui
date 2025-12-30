/**
 * Edge Comparison Stories
 *
 * Demonstrates different React Flow edge types and styling options.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { Node, Edge, Connection } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, Position, MarkerType, useEdgesState } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApCheckbox, ApDropdown, ApDropdownItem, ApTypography } from '@uipath/portal-shell-react';
import { FontVariantToken } from '@uipath/apollo-core';
import { Column } from '@uipath/uix/core';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { withCanvasProviders, useCanvasStory, StoryInfoPanel } from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta = {
  title: 'Canvas/Edges',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Helper Functions
// ============================================================================

interface NodePairConfig {
  id: string;
  label: string;
  row: number;
  column: number;
  yOffset?: number;
  extraHandles?: boolean;
}

const GRID = {
  startX: 400,
  startY: 100,
  nodeWidth: 350,
  nodeHeight: 200,
  columnGap: 500,
};

function createNodePair(config: NodePairConfig): Node[] {
  const { id, label, row, column, yOffset = 0, extraHandles = false } = config;
  const baseX = GRID.startX + column * GRID.columnGap;
  const baseY = GRID.startY + row * GRID.nodeHeight;

  const sourceHandles = extraHandles
    ? [
        {
          position: Position.Right,
          handles: [
            { id: 'out1', type: 'source' as const, handleType: 'output' as const },
            { id: 'out2', type: 'source' as const, handleType: 'output' as const },
          ],
        },
        {
          position: Position.Bottom,
          handles: [{ id: 'out3', type: 'source' as const, handleType: 'output' as const }],
        },
      ]
    : [
        {
          position: Position.Right,
          handles: [{ id: 'out', type: 'source' as const, handleType: 'output' as const }],
        },
      ];

  const targetHandles = extraHandles
    ? [
        {
          position: Position.Left,
          handles: [
            { id: 'in1', type: 'target' as const, handleType: 'input' as const },
            { id: 'in2', type: 'target' as const, handleType: 'input' as const },
          ],
        },
        {
          position: Position.Bottom,
          handles: [{ id: 'in3', type: 'target' as const, handleType: 'input' as const }],
        },
      ]
    : [
        {
          position: Position.Left,
          handles: [{ id: 'in', type: 'target' as const, handleType: 'input' as const }],
        },
      ];

  return [
    {
      id: `${id}-1`,
      type: 'uipath.blank-node',
      position: { x: baseX, y: baseY },
      data: {
        display: { label, icon: 'circle' },
        handleConfigurations: sourceHandles,
        parameters: {},
      },
    },
    {
      id: `${id}-2`,
      type: 'uipath.blank-node',
      position: { x: baseX + GRID.nodeWidth, y: baseY + yOffset },
      data: {
        display: { label, icon: 'square' },
        handleConfigurations: targetHandles,
        parameters: {},
      },
    },
  ];
}

// ============================================================================
// All Edge Types Story
// ============================================================================

function AllEdgeTypesStory() {
  const initialNodes = useMemo(() => {
    const yOffsets = [30, 0, 50, 45, 45] as const;
    return [
      // Column 1: Edge types
      ...createNodePair({
        id: 'default',
        label: 'Default',
        row: 0,
        column: 0,
        yOffset: yOffsets[0],
      }),
      ...createNodePair({
        id: 'straight',
        label: 'Straight',
        row: 1,
        column: 0,
        yOffset: yOffsets[1],
      }),
      ...createNodePair({ id: 'step', label: 'Step', row: 2, column: 0, yOffset: yOffsets[2] }),
      ...createNodePair({
        id: 'smoothstep',
        label: 'Smooth Step',
        row: 3,
        column: 0,
        yOffset: yOffsets[3],
      }),
      ...createNodePair({ id: 'bezier', label: 'Bezier', row: 4, column: 0, yOffset: yOffsets[4] }),
      // Column 2: Styling options
      ...createNodePair({
        id: 'animated',
        label: 'Animated',
        row: 0,
        column: 1,
        yOffset: -yOffsets[0],
      }),
      ...createNodePair({
        id: 'styled',
        label: 'Styled',
        row: 1,
        column: 1,
        yOffset: -yOffsets[1],
      }),
      ...createNodePair({
        id: 'labeled',
        label: 'Labeled',
        row: 2,
        column: 1,
        yOffset: -yOffsets[2],
      }),
      ...createNodePair({
        id: 'marker',
        label: 'Markers',
        row: 3,
        column: 1,
        yOffset: -yOffsets[3],
      }),
      ...createNodePair({ id: 'complex', label: 'Complex', row: 4, column: 1, extraHandles: true }),
    ];
  }, []);

  const initialEdges: Edge[] = useMemo(
    () => [
      // Edge types
      {
        id: 'e-default',
        source: 'default-1',
        target: 'default-2',
        sourceHandle: 'out',
        targetHandle: 'in',
        label: 'default (bezier)',
      },
      {
        id: 'e-straight',
        source: 'straight-1',
        target: 'straight-2',
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'straight',
        label: 'straight',
      },
      {
        id: 'e-step',
        source: 'step-1',
        target: 'step-2',
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'step',
        label: 'step',
      },
      {
        id: 'e-smoothstep',
        source: 'smoothstep-1',
        target: 'smoothstep-2',
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'smoothstep',
        label: 'smoothstep',
      },
      {
        id: 'e-bezier',
        source: 'bezier-1',
        target: 'bezier-2',
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'bezier',
        label: 'bezier',
      },
      // Styling options
      {
        id: 'e-animated',
        source: 'animated-1',
        target: 'animated-2',
        sourceHandle: 'out',
        targetHandle: 'in',
        animated: true,
        label: 'animated',
        style: { stroke: '#f6ab6c', strokeWidth: 2 },
      },
      {
        id: 'e-styled',
        source: 'styled-1',
        target: 'styled-2',
        sourceHandle: 'out',
        targetHandle: 'in',
        style: { stroke: '#ff0072', strokeWidth: 3, strokeDasharray: '5 5' },
        label: 'styled (dashed)',
        labelStyle: { fill: '#ff0072', fontWeight: 700 },
        labelBgStyle: { fill: '#ffebe6' },
      },
      {
        id: 'e-labeled',
        source: 'labeled-1',
        target: 'labeled-2',
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'smoothstep',
        label: 'Edge Label',
        labelStyle: { fill: '#2563eb', fontSize: 14, fontWeight: 600 },
        labelBgStyle: { fill: '#dbeafe', fillOpacity: 0.8 },
        labelShowBg: true,
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 4,
      },
      {
        id: 'e-marker',
        source: 'marker-1',
        target: 'marker-2',
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
        markerStart: { type: MarkerType.Arrow, color: '#22c55e' },
        style: { stroke: '#22c55e', strokeWidth: 2 },
        label: 'with arrows',
      },
      // Complex: multiple edges
      {
        id: 'e-complex-1',
        source: 'complex-1',
        target: 'complex-2',
        sourceHandle: 'out1',
        targetHandle: 'in1',
        type: 'bezier',
        style: { stroke: '#8b5cf6' },
        label: 'path 1',
      },
      {
        id: 'e-complex-2',
        source: 'complex-1',
        target: 'complex-2',
        sourceHandle: 'out2',
        targetHandle: 'in2',
        type: 'step',
        style: { stroke: '#ec4899' },
        label: 'path 2',
      },
      {
        id: 'e-complex-3',
        source: 'complex-1',
        target: 'complex-2',
        sourceHandle: 'out3',
        targetHandle: 'in3',
        type: 'smoothstep',
        style: { stroke: '#06b6d4' },
        label: 'path 3',
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas {...canvasProps} mode="design" defaultEdgeOptions={{ style: { strokeWidth: 2 } }}>
      <StoryInfoPanel title="React Flow Edge Types">
        <Column gap={8} style={{ marginTop: 8 }}>
          <ApTypography variant={FontVariantToken.fontSizeSBold}>Built-in Types</ApTypography>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            <li>
              <code>default</code> - Bezier curve
            </li>
            <li>
              <code>straight</code> - Direct line
            </li>
            <li>
              <code>step</code> - Right angles
            </li>
            <li>
              <code>smoothstep</code> - Rounded corners
            </li>
            <li>
              <code>bezier</code> - Curved path
            </li>
          </ul>
          <ApTypography variant={FontVariantToken.fontSizeSBold}>Properties</ApTypography>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            <li>
              <code>animated</code> - Animated flow
            </li>
            <li>
              <code>style</code> - Custom styling
            </li>
            <li>
              <code>label</code> - Edge labels
            </li>
            <li>
              <code>markerStart/End</code> - Arrows
            </li>
          </ul>
        </Column>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Interactive Edge Selection Story
// ============================================================================

function InteractiveEdgeSelectionStory() {
  const [selectedEdgeType, setSelectedEdgeType] = useState('default');
  const [isAnimated, setIsAnimated] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeColor, setStrokeColor] = useState('#718096');

  const initialNodes = useMemo(
    () => [
      {
        id: 'source',
        type: 'uipath.blank-node',
        position: { x: 200, y: 400 },
        data: {
          display: { label: 'Source Node' },
          handleConfigurations: [
            {
              position: Position.Right,
              handles: [{ id: 'out', type: 'source' as const, handleType: 'output' as const }],
            },
          ],
          parameters: {},
        },
      },
      {
        id: 'target',
        type: 'uipath.blank-node',
        position: { x: 600, y: 400 },
        data: {
          display: { label: 'Target Node' },
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: 'in', type: 'target' as const, handleType: 'input' as const }],
            },
          ],
          parameters: {},
        },
      },
    ],
    []
  );

  const currentEdge: Edge = useMemo(
    () => ({
      id: 'interactive-edge',
      source: 'source',
      target: 'target',
      sourceHandle: 'out',
      targetHandle: 'in',
      type: selectedEdgeType === 'default' ? undefined : selectedEdgeType,
      animated: isAnimated,
      label: `${selectedEdgeType} edge`,
      style: { stroke: strokeColor, strokeWidth },
      markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
    }),
    [selectedEdgeType, isAnimated, strokeColor, strokeWidth]
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges: [currentEdge] });
  const [edges, setEdges, onEdgesChange] = useEdgesState([currentEdge]);

  useEffect(() => setEdges([currentEdge]), [currentEdge, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => [
        ...eds,
        {
          ...params,
          id: `e-${Date.now()}`,
          type: selectedEdgeType === 'default' ? undefined : selectedEdgeType,
          animated: isAnimated,
          style: { stroke: strokeColor, strokeWidth },
        },
      ]),
    [setEdges, selectedEdgeType, isAnimated, strokeColor, strokeWidth]
  );

  return (
    <BaseCanvas
      {...canvasProps}
      edges={edges}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      mode="design"
    >
      <StoryInfoPanel title="Edge Configuration">
        <Column gap={12} style={{ marginTop: 12 }}>
          <ApDropdown
            size="small"
            label="Edge type"
            selectedValue={selectedEdgeType}
            onSelectedValueChanged={(e) => setSelectedEdgeType(e.detail as string)}
          >
            <ApDropdownItem value="default" label="Default (Bezier)" />
            <ApDropdownItem value="straight" label="Straight" />
            <ApDropdownItem value="step" label="Step" />
            <ApDropdownItem value="smoothstep" label="Smooth Step" />
            <ApDropdownItem value="bezier" label="Bezier" />
          </ApDropdown>

          <ApCheckbox
            label="Animated"
            checked={isAnimated}
            onValueChanged={(e) => setIsAnimated(e.detail as boolean)}
          />

          <Column gap={4}>
            <ApTypography variant={FontVariantToken.fontSizeS}>
              Stroke Width: {strokeWidth}px
            </ApTypography>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </Column>

          <Column gap={4}>
            <ApTypography variant={FontVariantToken.fontSizeS}>Stroke Color</ApTypography>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              style={{
                width: '100%',
                height: 32,
                borderRadius: 4,
                border: '1px solid var(--uix-canvas-border)',
                cursor: 'pointer',
              }}
            />
          </Column>

          <ApTypography
            color="var(--uix-canvas-foreground-de-emp)"
            variant={FontVariantToken.fontSizeXs}
          >
            Drag the nodes to see how the edge adapts.
          </ApTypography>
        </Column>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const AllEdgeTypes: Story = {
  name: 'All Edge Types',
  render: () => <AllEdgeTypesStory />,
};

export const InteractiveEdgeSelection: Story = {
  name: 'Interactive Edge Type',
  render: () => <InteractiveEdgeSelectionStory />,
};
