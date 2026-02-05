/**
 * BaseNode Stories
 *
 * Demonstrates the BaseNode component with various shapes, sizes, and execution states.
 */

import { Checkbox, FormControlLabel } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { FontVariantToken } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApButton, ApIcon, ApIconButton, ApTypography } from '@uipath/apollo-react/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NodeRegistryContext, NodeTypeRegistry } from '../../core';
import type { WorkflowManifest } from '../../schema/node-definition/workflow-manifest';
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

const sampleManifest: WorkflowManifest = {
  version: '1.0.0',
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
              repeat: 'dynamicInputs',
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
              repeat: 'dynamicOutputs',
            },
            {
              id: 'default',
              type: 'source',
              handleType: 'output',
              label: 'Default Output',
              visible: 'hasDefault',
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
              repeat: 'artifacts',
            },
          ],
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
        reg.registerManifest(sampleManifest);
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
  const [nodeData, setNodeData] = useState({
    dynamicInputs: [
      { label: 'Primary Input' },
      { label: 'Secondary Input' },
      { label: 'Tertiary Input' },
    ],
    dynamicOutputs: [{ name: 'Success Path' }, { name: 'Failure Path' }],
    hasDefault: false,
  });

  const initialNodes = useMemo(() => {
    return [
      {
        ...createNode({
          id: 'dynamic-handles-node',
          type: 'uipath.control-switch',
          position: { x: 400, y: 300 },
          data: {
            nodeType: 'uipath.control-switch',
            version: '1.0.0',
            inputs: {
              dynamicInputs: nodeData.dynamicInputs,
              dynamicOutputs: nodeData.dynamicOutputs,
              hasDefault: nodeData.hasDefault,
            },
            display: {
              label: 'Dynamic Handles',
              subLabel: `${nodeData.dynamicInputs.length} inputs, ${nodeData.dynamicOutputs.length} outputs`,
              shape: 'square',
            },
          },
        }),
        height: 96,
        width: 96,
      },
    ];
  }, [nodeData]);

  const { canvasProps, setNodes } = useCanvasStory({ initialNodes });

  // Update nodes when nodeData changes
  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === 'dynamic-handles-node'
          ? {
              ...node,
              data: {
                ...node.data,
                inputs: {
                  dynamicInputs: nodeData.dynamicInputs,
                  dynamicOutputs: nodeData.dynamicOutputs,
                  hasDefault: nodeData.hasDefault,
                },
                display: {
                  ...(node.data.display || {}),
                  subLabel: `${nodeData.dynamicInputs.length} inputs, ${nodeData.dynamicOutputs.length} outputs`,
                },
              },
            }
          : node
      )
    );
  }, [nodeData, setNodes]);

  const addHandle = useCallback((type: 'dynamicInputs' | 'dynamicOutputs') => {
    setNodeData((prev) => {
      const newArray = [...prev[type]];
      if (type === 'dynamicInputs') {
        newArray.push({ label: `Input ${newArray.length + 1}` });
      } else if (type === 'dynamicOutputs') {
        newArray.push({ name: `Output ${newArray.length + 1}` });
      }
      return { ...prev, [type]: newArray };
    });
  }, []);

  const removeHandle = useCallback((type: 'dynamicInputs' | 'dynamicOutputs') => {
    setNodeData((prev) => {
      const newArray = [...prev[type]];
      if (newArray.length > 0) {
        newArray.pop();
      }
      return { ...prev, [type]: newArray };
    });
  }, []);

  const handleTypes: Array<{
    key: 'dynamicInputs' | 'dynamicOutputs';
    label: string;
    icon: string;
  }> = [
    { key: 'dynamicInputs', label: 'Inputs', icon: 'arrow_back' },
    { key: 'dynamicOutputs', label: 'Outputs', icon: 'arrow_forward' },
  ];

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <NodeInspector />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Dynamic Handles"
        description="Interactive demonstration of dynamic handle generation. Use buttons to add/remove handles from arrays."
      >
        <Column gap={16}>
          {handleTypes.map(({ key, label, icon }) => (
            <Column key={key} gap={6} align="flex-start">
              <Row gap={8} align="center">
                <ApIcon name={icon} size="20px" />
                <ApTypography variant={FontVariantToken.fontSizeMBold}>{label}</ApTypography>
              </Row>
              <Row gap={8} align="center">
                <ApIconButton
                  onClick={() => removeHandle(key)}
                  disabled={nodeData[key].length === 0}
                  aria-label={`Remove ${label.toLowerCase()}`}
                >
                  <ApIcon name="remove" />
                </ApIconButton>
                <ApTypography
                  variant={FontVariantToken.fontSizeMBold}
                  style={{ minWidth: 24, textAlign: 'center' }}
                >
                  {nodeData[key].length}
                </ApTypography>
                <ApIconButton
                  onClick={() => addHandle(key)}
                  aria-label={`Add ${label.toLowerCase()}`}
                >
                  <ApIcon name="add" />
                </ApIconButton>
              </Row>
            </Column>
          ))}
          <Column gap={6} align="flex-start">
            <FormControlLabel
              control={
                <Checkbox
                  checked={nodeData.hasDefault}
                  onChange={(e) =>
                    setNodeData((prev) => ({ ...prev, hasDefault: e.target.checked }))
                  }
                />
              }
              label="Has Default Output"
            />
          </Column>
          <ApButton
            size="small"
            variant="secondary"
            label="Reset"
            onClick={() =>
              setNodeData({
                dynamicInputs: [{ label: 'Primary Input' }],
                dynamicOutputs: [{ name: 'Success Path' }],
                hasDefault: false,
              })
            }
          />
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
  render: () => <DynamicHandlesStory />,
};
