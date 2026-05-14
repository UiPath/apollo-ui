import type { Meta, StoryObj } from '@storybook/react';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button, Input, Label, Slider, Switch } from '@uipath/apollo-wind';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NodeRegistryProvider } from '../../core';
import type { CategoryManifest, NodeManifest } from '../../schema';
import {
  allCategoryManifests,
  allNodeManifests,
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import type { ValidationErrorSeverity } from '../../types/validation';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { NodeInspector } from '../NodeInspector';
import type { BaseNodeData } from './BaseNode.types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<BaseNodeData> = {
  title: 'Components/BaseNode V2',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Node Grid Definitions
// ============================================================================

const SHAPES = [
  { shape: 'circle', nodeType: 'uipath.manual-trigger' },
  { shape: 'square', nodeType: 'uipath.blank-node' },
  { shape: 'rectangle', nodeType: 'uipath.agent' },
] as const;
const STATUSES = ['NotExecuted', 'InProgress', 'Completed', 'Failed', 'Paused'] as const;

const GRID_CONFIG = {
  startX: 96,
  startY: 96,
  gapX: 192,
  gapY: 159,
};

function createShapeStatusGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  STATUSES.forEach((status, rowIndex) => {
    SHAPES.forEach(({ shape, nodeType }, colIndex) => {
      nodes.push(
        createNode({
          id: `${shape}-${status}`,
          type: nodeType,
          position: {
            x: GRID_CONFIG.startX + colIndex * GRID_CONFIG.gapX,
            y: GRID_CONFIG.startY + rowIndex * GRID_CONFIG.gapY,
          },
          data: {
            nodeType,
            version: '1.0.0',
            executionStatus: status,
            display: {
              label: shape,
              subLabel: status.replace(/([A-Z])/g, ' $1').trim(),
              shape,
            },
          },
        })
      );
    });
  });

  SHAPES.forEach(({ shape, nodeType }, shapeI) => {
    nodes.push(
      createNode({
        id: `${shape}-loading`,
        type: nodeType,
        position: {
          x: GRID_CONFIG.startX + shapeI * GRID_CONFIG.gapX,
          y: GRID_CONFIG.startY + STATUSES.length * GRID_CONFIG.gapY,
        },
        data: {
          nodeType,
          version: '1.0.0',
          display: { label: shape, shape, subLabel: 'Loading state' },
          loading: true,
        },
      })
    );
  });

  nodes.push(
    createNode({
      id: `unknown-node`,
      type: 'uipath.unknown-node',
      position: {
        x: GRID_CONFIG.startX,
        y: GRID_CONFIG.startY + (STATUSES.length + 1) * GRID_CONFIG.gapY,
      },
      data: {
        nodeType: 'uipath.unknown-node',
        version: '1.0.0',
        display: { label: 'Unknown Node', shape: 'square', subLabel: 'Missing manifest' },
      },
    })
  );

  nodes.push(
    createNode({
      id: `no-icon-node`,
      type: 'uipath.no-icon-node',
      position: {
        x: GRID_CONFIG.startX + GRID_CONFIG.gapX,
        y: GRID_CONFIG.startY + (STATUSES.length + 1) * GRID_CONFIG.gapY,
      },
      data: {
        nodeType: 'uipath.no-icon-node',
        version: '1.0.0',
        display: {
          label: 'Missing Icon',
          shape: 'square',
          subLabel: 'Fallback to icon w/ first letter',
        },
      },
    })
  );

  return nodes;
}

// ============================================================================
// Size Grid Definitions
// ============================================================================

const SQUARE_SIZES = [48, 64, 80, 96, 112, 128] as const;
const RECTANGLE_CONFIGS = [
  { width: 128, height: 48 },
  { width: 160, height: 64 },
  { width: 192, height: 80 },
  { width: 256, height: 96 },
  { width: 320, height: 112 },
] as const;

function createSizeGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];
  let xOffset = 96;

  SQUARE_SIZES.forEach((size) => {
    nodes.push({
      ...createNode({
        id: `sq-${size}`,
        type: 'uipath.blank-node',
        position: { x: xOffset, y: 96 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: String(size), shape: 'square' },
        },
      }),
      width: size,
      height: size,
    });
    xOffset += size + 32;
  });

  xOffset = 96;
  SQUARE_SIZES.forEach((size) => {
    nodes.push({
      ...createNode({
        id: `c-${size}`,
        type: 'uipath.blank-node',
        position: { x: xOffset, y: 272 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: String(size), shape: 'circle' },
        },
      }),
      width: size,
      height: size,
    });
    xOffset += size + 32;
  });

  let rectX = 96;
  let rectY = 448;
  RECTANGLE_CONFIGS.forEach(({ width, height }, index) => {
    nodes.push({
      ...createNode({
        id: `r-${index}`,
        type: 'uipath.agent',
        position: { x: rectX, y: rectY },
        data: {
          nodeType: 'uipath.agent',
          version: '1.0.0',
          display: { label: `${width}×${height}`, shape: 'rectangle' },
        },
      }),
      width,
      height,
    });

    rectX += width + 32;
    if (index === 2) {
      rectX = 96;
      rectY = 560;
    }
  });

  return nodes;
}

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo(() => createShapeStatusGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="BaseNode V2 — Shapes & States"
        description="Grid showing circle, square, and rectangle shapes with execution states."
      />
    </BaseCanvas>
  );
}

function CustomizedSizesStory() {
  const initialNodes = useMemo(() => createSizeGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <NodeInspector />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Customized Sizes"
        description="Nodes with various dimensions aligned to 16px grid."
      />
    </BaseCanvas>
  );
}

const dynamicHandlesManifest: { nodes: NodeManifest[]; categories: CategoryManifest[] } = {
  categories: [
    {
      id: 'control',
      name: 'Control Flow',
      sortOrder: 1,
      color: '#6c757d',
      colorDark: '#495057',
      icon: 'git-branch',
      tags: [],
    },
  ],
  nodes: [
    {
      nodeType: 'uipath.control-switch',
      version: '1.0.0',
      category: 'control',
      tags: ['dynamic', 'repeat'],
      sortOrder: 1,
      display: {
        label: 'Dynamic Handle Node',
        icon: 'switch',
        shape: 'square',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [
            {
              id: 'input-{index}',
              type: 'target',
              handleType: 'input',
              label: '{item.label}',
              repeat: 'inputs.dynamicInputs',
            },
          ],
        },
        {
          position: 'right',
          handles: [
            {
              id: 'output-{index}',
              type: 'source',
              handleType: 'output',
              label: '{item.name}',
              repeat: 'inputs.dynamicOutputs',
            },
            {
              id: 'default',
              type: 'source',
              handleType: 'output',
              label: 'Default Output',
              visible: 'inputs.hasDefault',
            },
          ],
        },
      ],
    },
    {
      nodeType: 'uipath.decision',
      version: '1.0.0',
      category: 'control',
      tags: ['control', 'decision'],
      sortOrder: 2,
      display: {
        label: 'Decision',
        icon: 'decision',
        shape: 'square',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [{ id: 'input', type: 'target', handleType: 'input' }],
        },
        {
          position: 'right',
          handles: [
            { id: 'true', type: 'source', handleType: 'output', label: '{inputs.trueLabel}' },
            { id: 'false', type: 'source', handleType: 'output', label: '{inputs.falseLabel}' },
          ],
        },
      ],
    },
  ],
};

function DynamicHandlesStory() {
  const [switchData, setSwitchData] = useState({
    dynamicInputs: [
      { label: 'Primary Input' },
      { label: 'Secondary Input' },
      { label: 'Tertiary Input' },
    ],
    dynamicOutputs: [{ name: 'Success Path' }, { name: 'Failure Path' }],
    hasDefault: false,
  });

  const [decisionData, setDecisionData] = useState({
    trueLabel: 'Approved',
    falseLabel: 'Rejected',
  });

  const initialNodes = useMemo(() => {
    return [
      {
        ...createNode({
          id: 'dynamic-handles-node',
          type: 'uipath.control-switch',
          position: { x: 700, y: 200 },
          data: {
            nodeType: 'uipath.control-switch',
            version: '1.0.0',
            inputs: {
              dynamicInputs: switchData.dynamicInputs,
              dynamicOutputs: switchData.dynamicOutputs,
              hasDefault: switchData.hasDefault,
            },
            display: {
              label: 'Dynamic Handles',
              subLabel: `${switchData.dynamicInputs.length} inputs, ${switchData.dynamicOutputs.length} outputs`,
              shape: 'square',
            },
          },
        }),
        height: 96,
        width: 96,
      },
      {
        ...createNode({
          id: 'decision-node',
          type: 'uipath.decision',
          position: { x: 700, y: 600 },
          data: {
            nodeType: 'uipath.decision',
            version: '1.0.0',
            inputs: {
              trueLabel: decisionData.trueLabel,
              falseLabel: decisionData.falseLabel,
            },
            display: {
              label: 'Decision',
              subLabel: 'Templated labels',
              shape: 'square',
            },
          },
        }),
        height: 96,
        width: 96,
      },
    ];
  }, [switchData, decisionData]);

  const { canvasProps, setNodes } = useCanvasStory({ initialNodes });

  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === 'dynamic-handles-node') {
          return {
            ...node,
            data: {
              ...node.data,
              inputs: {
                dynamicInputs: switchData.dynamicInputs,
                dynamicOutputs: switchData.dynamicOutputs,
                hasDefault: switchData.hasDefault,
              },
              display: {
                ...(node.data.display || {}),
                subLabel: `${switchData.dynamicInputs.length} inputs, ${switchData.dynamicOutputs.length} outputs`,
              },
            },
          };
        }
        if (node.id === 'decision-node') {
          return {
            ...node,
            data: {
              ...node.data,
              inputs: {
                trueLabel: decisionData.trueLabel,
                falseLabel: decisionData.falseLabel,
              },
            },
          };
        }
        return node;
      })
    );
  }, [switchData, decisionData, setNodes]);

  const handleInputCount = useCallback((value: number[]) => {
    const count = value[0] ?? 0;
    setSwitchData((prev) => {
      const current = prev.dynamicInputs;
      if (count > current.length) {
        const added = Array.from({ length: count - current.length }, (_, i) => ({
          label: `Input ${current.length + i + 1}`,
        }));
        return { ...prev, dynamicInputs: [...current, ...added] };
      }
      return { ...prev, dynamicInputs: current.slice(0, count) };
    });
  }, []);

  const handleOutputCount = useCallback((value: number[]) => {
    const count = value[0] ?? 0;
    setSwitchData((prev) => {
      const current = prev.dynamicOutputs;
      if (count > current.length) {
        const added = Array.from({ length: count - current.length }, (_, i) => ({
          name: `Output ${current.length + i + 1}`,
        }));
        return { ...prev, dynamicOutputs: [...current, ...added] };
      }
      return { ...prev, dynamicOutputs: current.slice(0, count) };
    });
  }, []);

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Dynamic Handles"
        description="Demonstrates repeat expressions (dynamic handle count) and templated handle labels."
      >
        <Column gap={20}>
          <Column gap={12}>
            <Label className="font-semibold">Switch Node — Repeat Handles</Label>
            <Column gap={6} align="flex-start">
              <Label>Inputs ({switchData.dynamicInputs.length})</Label>
              <Slider
                value={[switchData.dynamicInputs.length]}
                onValueChange={handleInputCount}
                min={0}
                max={10}
                step={1}
              />
            </Column>
            <Column gap={6} align="flex-start">
              <Label>Outputs ({switchData.dynamicOutputs.length})</Label>
              <Slider
                value={[switchData.dynamicOutputs.length]}
                onValueChange={handleOutputCount}
                min={0}
                max={10}
                step={1}
              />
            </Column>
            <div className="flex items-center gap-2">
              <Switch
                checked={switchData.hasDefault}
                onCheckedChange={(checked) =>
                  setSwitchData((prev) => ({ ...prev, hasDefault: checked }))
                }
              />
              <Label>Has Default Output</Label>
            </div>
          </Column>

          <Column gap={12}>
            <Label className="font-semibold">Decision Node — Templated Labels</Label>
            <Column gap={6} align="flex-start">
              <Label>True Label</Label>
              <Input
                value={decisionData.trueLabel}
                onChange={(e) =>
                  setDecisionData((prev) => ({ ...prev, trueLabel: e.target.value }))
                }
              />
            </Column>
            <Column gap={6} align="flex-start">
              <Label>False Label</Label>
              <Input
                value={decisionData.falseLabel}
                onChange={(e) =>
                  setDecisionData((prev) => ({ ...prev, falseLabel: e.target.value }))
                }
              />
            </Column>
          </Column>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSwitchData({
                dynamicInputs: [{ label: 'Primary Input' }],
                dynamicOutputs: [{ name: 'Success Path' }],
                hasDefault: false,
              });
              setDecisionData({ trueLabel: 'Approved', falseLabel: 'Rejected' });
            }}
          >
            Reset All
          </Button>
        </Column>
      </StoryInfoPanel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  name: 'Default',
  render: () => <DefaultStory />,
};

export const CustomizedSizes: Story = {
  name: 'Customized sizes',
  render: () => <CustomizedSizesStory />,
};

export const DynamicHandles: Story = {
  name: 'Dynamic Handles',
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={dynamicHandlesManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <DynamicHandlesStory />,
};

// ============================================================================
// Validation States Story
// ============================================================================

const VALIDATION_SEVERITIES = ['WARNING', 'ERROR', 'CRITICAL'] as const;

const validationMessages: Record<string, string> = {
  WARNING: 'Trigger should be connected to at least one node',
  ERROR: 'URL is required',
  CRITICAL: 'Node configuration is invalid',
};

function createValidationGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  VALIDATION_SEVERITIES.forEach((severity, rowIndex) => {
    SHAPES.forEach(({ shape, nodeType }, colIndex) => {
      nodes.push(
        createNode({
          id: `validation-${shape}-${severity}`,
          type: nodeType,
          position: {
            x: GRID_CONFIG.startX + colIndex * GRID_CONFIG.gapX,
            y: GRID_CONFIG.startY + rowIndex * GRID_CONFIG.gapY,
          },
          data: {
            nodeType,
            version: '1.0.0',
            display: {
              label: shape,
              subLabel: severity,
              shape,
            },
          },
        })
      );
    });
  });

  return nodes;
}

function ValidationStatesStory() {
  const initialNodes = useMemo(() => createValidationGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Validation States"
        description="Grid showing warning, error, and critical validation badges across shapes."
      />
    </BaseCanvas>
  );
}

// ============================================================================
// Adornments Story
// ============================================================================

const ADORNMENT_ROWS = [
  { key: 'breakpoint', label: 'Breakpoint (top-left)' },
  { key: 'status-completed', label: 'Status: Completed (top-right)' },
  { key: 'status-inprogress', label: 'Status: InProgress (top-right)' },
  { key: 'status-failed', label: 'Status: Failed (top-right)' },
  { key: 'start-point', label: 'Start Point (bottom-left)' },
  { key: 'square-dashed', label: 'Square Dashed (bottom-right)' },
  { key: 'all', label: 'All Adornments' },
  { key: 'multi-exec', label: 'Multi-execution (count: 5)' },
] as const;

function createAdornmentGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  ADORNMENT_ROWS.forEach((row, rowIndex) => {
    SHAPES.forEach(({ shape, nodeType }, colIndex) => {
      nodes.push(
        createNode({
          id: `adorn-${row.key}-${shape}`,
          type: nodeType,
          position: {
            x: GRID_CONFIG.startX + colIndex * GRID_CONFIG.gapX,
            y: GRID_CONFIG.startY + rowIndex * GRID_CONFIG.gapY,
          },
          data: {
            nodeType,
            version: '1.0.0',
            display: {
              label: shape,
              subLabel: row.label,
              shape,
            },
          },
        })
      );
    });
  });

  return nodes;
}

function getAdornmentExecutionState(key: string) {
  switch (key) {
    case 'breakpoint':
      return { status: 'None' as const, debug: true };
    case 'status-completed':
      return { status: 'Completed' as const };
    case 'status-inprogress':
      return { status: 'InProgress' as const };
    case 'status-failed':
      return { status: 'Failed' as const };
    case 'start-point':
      return { status: 'None' as const, isExecutionStartPoint: true };
    case 'square-dashed':
      return { status: 'None' as const, isOutputPinned: true };
    case 'all':
      return {
        status: 'Completed' as const,
        debug: true,
        isExecutionStartPoint: true,
        isOutputPinned: true,
      };
    case 'multi-exec':
      return { status: 'Completed' as const, count: 5 };
    default:
      return undefined;
  }
}

function AdornmentsStory() {
  const initialNodes = useMemo(() => createAdornmentGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Adornments"
        description="Grid showing all adornment types across shapes."
      />
    </BaseCanvas>
  );
}

export const Adornments: Story = {
  name: 'Adornments',
  decorators: [
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: (nodeId: string) => {
          const parts = nodeId.split('-');
          const key = parts.slice(1, -1).join('-');
          return getAdornmentExecutionState(key);
        },
        getEdgeExecutionState: () => undefined,
      },
      validationState: {
        getElementValidationState: () => undefined,
      },
    }),
  ],
  render: () => <AdornmentsStory />,
};

// ============================================================================
// Stacked Treatment Story
// ============================================================================

const stackedManifest: { nodes: NodeManifest[]; categories: CategoryManifest[] } = {
  categories: [
    ...allCategoryManifests,
    {
      id: 'agents',
      name: 'Agents',
      sortOrder: 1,
      color: '#7c3aed',
      colorDark: '#8b5cf6',
      icon: 'robot',
      tags: [],
    },
  ],
  nodes: [
    ...allNodeManifests,
    {
      nodeType: 'uipath.agent.drillable',
      version: '1.0.0',
      category: 'agents',
      tags: ['agent'],
      sortOrder: 1,
      drillable: true,
      display: {
        label: 'Drillable Agent',
        icon: 'agent',
        shape: 'square',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [{ id: 'input', type: 'target', handleType: 'input' }],
        },
        {
          position: 'right',
          handles: [{ id: 'output', type: 'source', handleType: 'output' }],
        },
      ],
    },
  ],
};

function StackedTreatmentStory() {
  const initialNodes = useMemo<Node<BaseNodeData>[]>(
    () => [
      createNode({
        id: 'plain',
        type: 'uipath.blank-node',
        position: { x: 96, y: 200 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: 'Plain', subLabel: 'No treatment', shape: 'square' },
        },
      }),
      createNode({
        id: 'drillable',
        type: 'uipath.agent.drillable',
        position: { x: 320, y: 200 },
        data: {
          nodeType: 'uipath.agent.drillable',
          version: '1.0.0',
          display: { label: 'Drillable', subLabel: 'manifest.drillable', shape: 'square' },
        },
      }),
      createNode({
        id: 'collapsed',
        type: 'uipath.blank-node',
        position: { x: 544, y: 200 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: 'Collapsed', subLabel: 'data.isCollapsed', shape: 'square' },
          isCollapsed: true,
        },
      }),
    ],
    []
  );
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Stacked Treatment"
        description="Drillable (manifest) and collapsed (instance data) nodes render a decorative stacked layer behind the card."
      />
    </BaseCanvas>
  );
}

export const StackedTreatment: Story = {
  name: 'Stacked Treatment',
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={stackedManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <StackedTreatmentStory />,
};

// ============================================================================
// canvasLabel Resolution Story
// ============================================================================

const canvasLabelManifest: { nodes: NodeManifest[]; categories: CategoryManifest[] } = {
  categories: [
    ...allCategoryManifests,
    {
      id: 'communications',
      name: 'Communications',
      sortOrder: 99,
      color: '#3b82f6',
      colorDark: '#60a5fa',
      icon: 'agent',
      tags: [],
    },
  ],
  nodes: [
    ...allNodeManifests,
    {
      nodeType: 'uipath.send-outlook-email',
      version: '1.0.0',
      category: 'communications',
      tags: ['email', 'outlook'],
      sortOrder: 1,
      display: {
        label: 'Send Outlook 365 Email',
        canvasLabel: 'Send Email',
        icon: 'agent',
        shape: 'rectangle',
      },
      handleConfiguration: [
        { position: 'left', handles: [{ id: 'input', type: 'target', handleType: 'input' }] },
        { position: 'right', handles: [{ id: 'output', type: 'source', handleType: 'output' }] },
      ],
    },
    {
      nodeType: 'uipath.long-decision',
      version: '1.0.0',
      category: 'communications',
      tags: ['decision'],
      sortOrder: 2,
      display: {
        label: 'Long Decision Without canvasLabel',
        icon: 'agent',
        shape: 'rectangle',
      },
      handleConfiguration: [
        { position: 'left', handles: [{ id: 'input', type: 'target', handleType: 'input' }] },
        { position: 'right', handles: [{ id: 'output', type: 'source', handleType: 'output' }] },
      ],
    },
  ],
};

function CanvasLabelStory() {
  const initialNodes = useMemo<Node<BaseNodeData>[]>(
    () => [
      createNode({
        id: 'with-canvaslabel',
        type: 'uipath.send-outlook-email',
        position: { x: 96, y: 160 },
        data: {
          nodeType: 'uipath.send-outlook-email',
          version: '1.0.0',
          display: { shape: 'rectangle', subLabel: 'manifest.canvasLabel wins' },
        },
      }),
      createNode({
        id: 'without-canvaslabel',
        type: 'uipath.long-decision',
        position: { x: 96, y: 320 },
        data: {
          nodeType: 'uipath.long-decision',
          version: '1.0.0',
          display: {
            shape: 'rectangle',
            subLabel: 'falls back to manifest.label since canvasLabel is not defined',
          },
        },
      }),
      createNode({
        id: 'instance-rename',
        type: 'uipath.send-outlook-email',
        position: { x: 96, y: 480 },
        data: {
          nodeType: 'uipath.send-outlook-email',
          version: '1.0.0',
          display: {
            shape: 'rectangle',
            canvasLabel: 'Notify Ops Team',
            subLabel: 'instance.canvasLabel overrides manifest.canvasLabel',
          },
        },
      }),
    ],
    []
  );
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="canvasLabel resolution"
        description={
          'Three instances exercising the precedence ' +
          'instance.canvasLabel > instance.label > manifest.canvasLabel > manifest.label.'
        }
      />
    </BaseCanvas>
  );
}

export const CanvasLabel: Story = {
  name: 'canvasLabel resolution',
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={canvasLabelManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <CanvasLabelStory />,
};

export const ValidationStates: Story = {
  name: 'Validation States',
  decorators: [
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: () => undefined,
        getEdgeExecutionState: () => undefined,
      },
      validationState: {
        getElementValidationState: (elementId: string) => {
          const severity = elementId.split('-').pop() as string;
          if (!['WARNING', 'ERROR', 'CRITICAL'].includes(severity)) return undefined;
          return {
            validationStatus: severity as ValidationErrorSeverity,
            validationError: {
              code: `VALIDATION_${severity}`,
              message: validationMessages[severity] ?? `Validation ${severity.toLowerCase()}`,
              description: validationMessages[severity] ?? `Validation ${severity.toLowerCase()}`,
              severity: severity as ValidationErrorSeverity,
            },
          };
        },
      },
    }),
  ],
  render: () => <ValidationStatesStory />,
};
