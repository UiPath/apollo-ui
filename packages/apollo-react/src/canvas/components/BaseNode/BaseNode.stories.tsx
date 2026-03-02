/**
 * BaseNode Stories
 *
 * Demonstrates the BaseNode component with various shapes, sizes, and execution states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button, Input, Label, Slider, Switch } from '@uipath/apollo-wind';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NodeRegistryContext, NodeTypeRegistry } from '../../core';
import type { CategoryManifest, NodeManifest } from '../../schema';
import {
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { NodeInspector } from '../NodeInspector';
import type { BaseNodeData } from './BaseNode.types';

// ============================================================================
// Sample Manifests
// ============================================================================

const sampleManifest: { nodes: NodeManifest[]; categories: CategoryManifest[] } = {
  categories: [
    {
      id: 'general',
      name: 'General',
      sortOrder: 1,
      color: '#6c757d',
      colorDark: '#495057',
      icon: 'layers',
      tags: [],
    },
    {
      id: 'ai',
      name: 'AI',
      sortOrder: 2,
      color: '#6c757d',
      colorDark: '#495057',
      icon: 'layers',
      tags: [],
    },
    {
      id: 'control',
      name: 'Control Flow',
      sortOrder: 3,
      color: '#6c757d',
      colorDark: '#495057',
      icon: 'git-branch',
      tags: [],
    },
  ],
  nodes: [
    {
      nodeType: 'generic',
      version: '1.0.0',
      category: 'general',
      tags: ['general'],
      sortOrder: 1,
      display: {
        label: 'Generic Node',
        icon: 'box',
        shape: 'square',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [{ id: 'in', type: 'target', handleType: 'input', label: 'Input' }],
        },
        {
          position: 'right',
          handles: [{ id: 'out', type: 'source', handleType: 'output', label: 'Output' }],
        },
      ],
    },
    {
      nodeType: 'uipath.blank-node',
      version: '1.0.0',
      category: 'general',
      tags: ['basic'],
      sortOrder: 2,
      display: {
        label: 'Blank Node',
        icon: 'square',
        shape: 'square',
      },
      handleConfiguration: [],
    },
    {
      nodeType: 'uipath.agent',
      version: '1.0.0',
      category: 'ai',
      tags: ['ai', 'agent'],
      sortOrder: 3,
      display: {
        label: 'Agent',
        icon: 'bot',
        shape: 'rectangle',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [{ id: 'in', type: 'target', handleType: 'input', label: 'Input' }],
        },
        {
          position: 'right',
          handles: [{ id: 'out', type: 'source', handleType: 'output', label: 'Output' }],
        },
      ],
    },
    {
      nodeType: 'uipath.control-switch',
      version: '1.0.0',
      category: 'control',
      tags: ['dynamic', 'repeat'],
      sortOrder: 5,
      display: {
        label: 'Dynamic Handle Node',
        icon: 'git-branch',
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
        {
          position: 'bottom',
          handles: [
            {
              id: 'artifact-{index}',
              type: 'source',
              handleType: 'artifact',
              label: 'Artifact {index}: {item.type}',
              repeat: 'inputs.artifacts',
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
      sortOrder: 6,
      display: {
        label: 'Decision',
        icon: 'git-branch',
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
    {
      nodeType: 'uipath.control-flow.terminate',
      version: '1.0.0',
      category: 'control',
      tags: ['control', 'terminate'],
      sortOrder: 6,
      display: {
        label: 'Terminate',
        icon: 'git-branch',
        shape: 'circle',
      },
      handleConfiguration: [
        {
          position: 'right',
          handles: [{ id: 'out', type: 'source', handleType: 'output', label: 'Output' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<BaseNodeData> = {
  title: 'Canvas/BaseNode',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      const registry = useMemo(() => {
        const reg = new NodeTypeRegistry();
        reg.registerManifest(sampleManifest.nodes, sampleManifest.categories);
        return reg;
      }, []);

      const contextValue = useMemo(() => ({ registry }), [registry]);

      return (
        <NodeRegistryContext.Provider value={contextValue}>{Story()}</NodeRegistryContext.Provider>
      );
    },
    withCanvasProviders(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Node Grid Definitions
// ============================================================================

const SHAPES = ['circle', 'square', 'rectangle'] as const;
const STATUSES = ['NotExecuted', 'InProgress', 'Completed', 'Failed', 'Paused'] as const;

const GRID_CONFIG = {
  startX: 96,
  startY: 96,
  gapX: 192,
  gapY: 159,
};

/**
 * Creates a grid of nodes showing all shape/status combinations.
 */
function createShapeStatusGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  STATUSES.forEach((status, rowIndex) => {
    SHAPES.forEach((shape, colIndex) => {
      const label = shape === 'rectangle' ? 'Invoice approval agent' : 'Header';
      const nodeType = shape === 'rectangle' ? 'uipath.agent' : 'uipath.blank-node';

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
              label,
              subLabel: status.replace(/([A-Z])/g, ' $1').trim(),
              shape,
            },
          },
        })
      );
    });
  });

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

/**
 * Creates nodes demonstrating various sizes.
 */
function createSizeGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];
  let xOffset = 96;

  // Row 1: Square shapes
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

  // Row 2: Circle shapes
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

  // Row 3-4: Rectangle shapes
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
        title="BaseNode Shapes & States"
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

  // Sync switch node data when controls change
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

/**
 * Creates nodes demonstrating loading/skeleton states for all shapes.
 * Uses `data.loading: true` to enable the skeleton state.
 */
function createLoadingGrid(): Node<BaseNodeData>[] {
  const shapes = [
    { type: 'uipath.blank-node', shape: 'square' as const, label: 'Square' },
    { type: 'uipath.control-flow.terminate', shape: 'circle' as const, label: 'Circle' },
    { type: 'uipath.agent', shape: 'rectangle' as const, label: 'Rectangle' },
  ];

  return shapes.map((config, index) =>
    createNode({
      id: `loading-${config.shape}`,
      type: config.type,
      position: { x: 96 + index * 192, y: 96 },
      data: {
        nodeType: config.type,
        version: '1.0.0',
        loading: true, // Enable skeleton loading state
        display: {
          label: config.label,
          subLabel: 'Loading...',
          shape: config.shape,
        },
      },
    })
  );
}

function LoadingStory() {
  const initialNodes = useMemo(() => createLoadingGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Loading State"
        description="Nodes in skeleton loading state for circle, square, and rectangle shapes."
      />
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
  render: () => <DynamicHandlesStory />,
};

export const Loading: Story = {
  name: 'Loading',
  render: () => <LoadingStory />,
};
