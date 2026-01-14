import type { Meta, StoryObj } from '@storybook/react';
import { type Node, Panel, ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { ExecutionStatusContext } from '../../../hooks';
import type { NodeManifest } from '../../../schema/node-definition/node-manifest';
import { StoryInfoPanel, useCanvasStory } from '../../../storybook-utils';
import { DefaultCanvasTranslations } from '../../../types';
import { BaseCanvas } from '../../BaseCanvas';
import type { BaseNodeData, NodeShape } from '../../BaseNode/BaseNode.types';
import { NodeRegistryProvider } from '../../BaseNode/NodeRegistryProvider';
import { CanvasPositionControls } from '../../CanvasPositionControls';

// ============================================================================
// Node Manifests
// ============================================================================
// These manifests use default toolbar actions from the toolbar resolver
// (delete, duplicate, breakpoint in design mode)

const toolbarDemoManifest: NodeManifest = {
  nodeType: 'toolbarDemo',
  version: '1.0.0',
  category: 'demo',
  description: 'Node demonstrating toolbar functionality',
  tags: ['demo', 'toolbar'],
  sortOrder: 0,
  display: {
    label: 'Toolbar Demo',
    icon: 'home',
  },
  handleConfiguration: [],
};

const rectangleDemoManifest: NodeManifest = {
  nodeType: 'rectangleDemo',
  version: '1.0.0',
  category: 'demo',
  description: 'Rectangle node for toolbar demo',
  tags: ['demo', 'shape'],
  sortOrder: 1,
  display: {
    label: 'Rectangle',
    icon: 'square',
    shape: 'rectangle',
  },
  handleConfiguration: [],
};

const squareDemoManifest: NodeManifest = {
  nodeType: 'squareDemo',
  version: '1.0.0',
  category: 'demo',
  description: 'Square node for toolbar demo',
  tags: ['demo', 'shape'],
  sortOrder: 2,
  display: {
    label: 'Square',
    icon: 'square',
    shape: 'square',
  },
  handleConfiguration: [],
};

const circleDemoManifest: NodeManifest = {
  nodeType: 'circleDemo',
  version: '1.0.0',
  category: 'demo',
  description: 'Circle node for toolbar demo',
  tags: ['demo', 'shape'],
  sortOrder: 3,
  display: {
    label: 'Circle',
    icon: 'circle',
    shape: 'circle',
  },
  handleConfiguration: [],
};

const customToolbarManifest: NodeManifest = {
  nodeType: 'customToolbarDemo',
  version: '1.0.0',
  category: 'demo',
  description: 'Node with custom toolbar extensions',
  tags: ['demo', 'toolbar', 'custom'],
  sortOrder: 4,
  display: {
    label: 'Custom Toolbar',
    icon: 'settings',
  },
  handleConfiguration: [],
  toolbarExtensions: {
    design: {
      actions: [{ id: 'open-workflow', icon: 'external-link', label: 'Open workflow' }],
    },
  },
};

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta = {
  title: 'Canvas/NodeToolbar',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => {
      const executions = useMemo(
        () => ({ getNodeExecutionState: () => undefined, getEdgeExecutionState: () => undefined }),
        []
      );

      const manifests = useMemo(
        () => [
          toolbarDemoManifest,
          rectangleDemoManifest,
          squareDemoManifest,
          circleDemoManifest,
          customToolbarManifest,
        ],
        []
      );

      return (
        <ExecutionStatusContext.Provider value={executions}>
          <ReactFlowProvider>
            <NodeRegistryProvider registrations={manifests}>
              <div style={{ height: '100vh', width: '100vw' }}>
                <Story />
              </div>
            </NodeRegistryProvider>
          </ReactFlowProvider>
        </ExecutionStatusContext.Provider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Helper Functions
// ============================================================================

const SHAPES: NodeShape[] = ['rectangle', 'square', 'circle'];

function createToolbarNodes(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  SHAPES.forEach((shape, index) => {
    const nodeType = `${shape}Demo`;
    nodes.push({
      id: `${shape}-demo`,
      type: nodeType,
      position: { x: 200 + index * 300, y: 250 },
      data: {
        nodeType,
        version: '1.0.0',
        parameters: {},
        display: {
          label: shape.charAt(0).toUpperCase() + shape.slice(1),
          subLabel: 'Hover to see toolbar',
        },
      },
    });
  });

  return nodes;
}

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo(() => createToolbarNodes(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel
        title="Node Toolbar"
        description="Hover over nodes to see default toolbar actions (delete, duplicate, breakpoint)"
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function CustomToolbarStory() {
  const initialNodes = useMemo(
    () => [
      {
        id: 'custom-toolbar-1',
        type: 'customToolbarDemo',
        position: { x: 400, y: 300 },
        data: {
          nodeType: 'customToolbarDemo',
          version: '1.0.0',
          parameters: {},
          display: {
            label: 'Workflow Node',
            subLabel: 'With custom toolbar action',
          },
        },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel
        title="Custom Toolbar Extensions"
        description="This node has a custom 'Open workflow' action in addition to the default toolbar actions (delete, duplicate, breakpoint)"
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  name: 'Default Toolbar',
  render: () => <DefaultStory />,
};

export const CustomToolbarExtensions: Story = {
  name: 'Custom Toolbar Extensions',
  render: () => <CustomToolbarStory />,
};
