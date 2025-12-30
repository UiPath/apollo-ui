/**
 * BaseNode Stories
 *
 * Demonstrates the BaseNode component with various shapes, sizes, and execution states.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';
import type { Node } from '@uipath/uix/xyflow/react';
import { Panel } from '@uipath/uix/xyflow/react';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { NodeInspector } from '../NodeInspector';
import type { BaseNodeData } from './BaseNode.types';
import { useNodeTypeRegistry } from './useNodeTypeRegistry';
import {
  withCanvasProviders,
  useCanvasStory,
  createNode,
  StoryInfoPanel,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<BaseNodeData> = {
  title: 'Canvas/BaseNode',
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
function createShapeStatusGrid(
  registry: ReturnType<typeof useNodeTypeRegistry>
): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  STATUSES.forEach((status, rowIndex) => {
    SHAPES.forEach((shape, colIndex) => {
      const label = shape === 'rectangle' ? 'Invoice approval agent' : 'Header';
      nodes.push(
        createNode({
          id: `${shape}-${status}`,
          type: 'uipath.blank-node',
          position: {
            x: GRID_CONFIG.startX + colIndex * GRID_CONFIG.gapX,
            y: GRID_CONFIG.startY + rowIndex * GRID_CONFIG.gapY,
          },
          data: {
            ...registry.createDefaultData('generic'),
            display: { label, subLabel: status.replace(/([A-Z])/g, ' $1').trim(), shape },
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
function createSizeGrid(registry: ReturnType<typeof useNodeTypeRegistry>): Node<BaseNodeData>[] {
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
          ...registry.createDefaultData('uipath.blank-node'),
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
          ...registry.createDefaultData('uipath.blank-node'),
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
          ...registry.createDefaultData('uipath.agent'),
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
  const nodeTypeRegistry = useNodeTypeRegistry();
  const initialNodes = useMemo(() => createShapeStatusGrid(nodeTypeRegistry), [nodeTypeRegistry]);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
      <StoryInfoPanel
        title="BaseNode Shapes & States"
        description="Grid showing circle, square, and rectangle shapes with execution states."
      />
    </BaseCanvas>
  );
}

function CustomizedSizesStory() {
  const nodeTypeRegistry = useNodeTypeRegistry();
  const initialNodes = useMemo(() => createSizeGrid(nodeTypeRegistry), [nodeTypeRegistry]);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <NodeInspector />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
      <StoryInfoPanel
        title="Customized Sizes"
        description="Nodes with various dimensions aligned to 16px grid."
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
