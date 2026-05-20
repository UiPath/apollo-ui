import type { Meta, StoryObj } from '@storybook/react';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { type Node, Panel, ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button } from '@uipath/apollo-wind';
import { useMemo, useState } from 'react';
import { NodeRegistryProvider } from '../../../core';
import { ExecutionStatusContext } from '../../../hooks';
import type { NodeManifest, NodeShape } from '../../../schema';
import { StoryInfoPanel, useCanvasStory } from '../../../storybook-utils';
import { DefaultCanvasTranslations } from '../../../types';
import { BaseCanvas } from '../../BaseCanvas';
import type { BaseNodeData } from '../../BaseNode/BaseNode.types';
import { BaseNodeOverrideConfigProvider } from '../../BaseNode/BaseNodeConfigContext';
import { CanvasPositionControls } from '../../CanvasPositionControls';
import type { NodeToolbarConfig } from './NodeToolbar.types';

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
    icon: 'house',
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
  title: 'Components/NodeToolbar',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => {
      const executions = useMemo(
        () => ({ getNodeExecutionState: () => undefined, getEdgeExecutionState: () => undefined }),
        []
      );

      const manifest = useMemo(
        () => ({
          version: '1.0.0',
          categories: [],
          nodes: [
            toolbarDemoManifest,
            rectangleDemoManifest,
            squareDemoManifest,
            circleDemoManifest,
            customToolbarManifest,
          ],
        }),
        []
      );

      return (
        <ExecutionStatusContext.Provider value={executions}>
          <ReactFlowProvider>
            <NodeRegistryProvider manifest={manifest}>
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

type ToolbarPosition = NonNullable<NodeToolbarConfig['position']>;
type ToolbarAlign = NonNullable<NodeToolbarConfig['align']>;

const POSITION_OPTIONS: ToolbarPosition[] = ['top', 'bottom', 'left', 'right'];
const ALIGN_OPTIONS: ToolbarAlign[] = ['start', 'center', 'end'];

function DefaultStory() {
  const initialNodes = useMemo(() => createToolbarNodes(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  const [position, setPosition] = useState<ToolbarPosition>('top');
  const [align, setAlign] = useState<ToolbarAlign>('center');

  const overrideConfig = useMemo(
    () => ({
      toolbarConfig: {
        actions: [
          { id: 'delete', icon: 'trash', label: 'Delete', onAction: () => {} },
          { id: 'duplicate', icon: 'copy', label: 'Duplicate', onAction: () => {} },
          { id: 'breakpoint', icon: 'circle', label: 'Toggle breakpoint', onAction: () => {} },
        ],
        position,
        align,
      } satisfies NodeToolbarConfig,
    }),
    [position, align]
  );

  return (
    <BaseNodeOverrideConfigProvider value={overrideConfig}>
      <BaseCanvas {...canvasProps} mode="design">
        <StoryInfoPanel
          title="Node Toolbar"
          collapsible
          defaultCollapsed={false}
          position="top-right"
        >
          <Column mt={12} gap={12}>
            <Column gap={4}>
              <span className="text-sm font-semibold">Position:</span>
              <Row gap={4} wrap="wrap">
                {POSITION_OPTIONS.map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={position === value ? 'default' : 'secondary'}
                    onClick={() => setPosition(value)}
                  >
                    {value}
                  </Button>
                ))}
              </Row>
            </Column>
            <Column gap={4}>
              <span className="text-sm font-semibold">Align:</span>
              <Row gap={4} wrap="wrap">
                {ALIGN_OPTIONS.map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={align === value ? 'default' : 'secondary'}
                    onClick={() => setAlign(value)}
                  >
                    {value}
                  </Button>
                ))}
              </Row>
            </Column>
          </Column>
        </StoryInfoPanel>
        <Panel position="bottom-right">
          <CanvasPositionControls translations={DefaultCanvasTranslations} />
        </Panel>
      </BaseCanvas>
    </BaseNodeOverrideConfigProvider>
  );
}

function OverflowMenuStory() {
  const initialNodes = useMemo(() => createToolbarNodes(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  const overrideConfig = useMemo(
    () => ({
      toolbarConfig: {
        actions: [
          { id: 'edit', icon: 'pencil', label: 'Edit', onAction: () => {} },
          { id: 'run', icon: 'play', label: 'Run single step', onAction: () => {} },
          { id: 'expand', icon: 'maximize-2', label: 'Expand inline', onAction: () => {} },
        ],
        overflowLabel: 'More options',
        overflowActions: [
          { id: 'breakpoint', icon: 'circle', label: 'Toggle breakpoint', onAction: () => {} },
          { id: 'duplicate', icon: 'copy', label: 'Duplicate', onAction: () => {} },
          { id: 'comment', icon: 'message-square', label: 'Add comment', onAction: () => {} },
          { id: 'delete', icon: 'trash', label: 'Delete', onAction: () => {} },
        ],
      } satisfies NodeToolbarConfig,
    }),
    []
  );

  return (
    <BaseNodeOverrideConfigProvider value={overrideConfig}>
      <BaseCanvas {...canvasProps} mode="design">
        <StoryInfoPanel
          title="Toolbar with Overflow Menu"
          description="Primary actions render inline. The trailing '…' button opens a dropdown with the overflow actions"
        />
        <Panel position="bottom-right">
          <CanvasPositionControls translations={DefaultCanvasTranslations} />
        </Panel>
      </BaseCanvas>
    </BaseNodeOverrideConfigProvider>
  );
}

function SingleActionStory() {
  const initialNodes = useMemo(() => createToolbarNodes(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  const [position, setPosition] = useState<ToolbarPosition>('top');
  const [align, setAlign] = useState<ToolbarAlign>('center');

  const overrideConfig = useMemo(
    () => ({
      toolbarConfig: {
        actions: [
          { id: 'breakpoint', icon: 'circle', label: 'Toggle breakpoint', onAction: () => {} },
        ],
        position,
        align,
      } satisfies NodeToolbarConfig,
    }),
    [position, align]
  );

  return (
    <BaseNodeOverrideConfigProvider value={overrideConfig}>
      <BaseCanvas {...canvasProps} mode="design">
        <StoryInfoPanel
          title="Single-action Toolbar"
          description="Toolbar with only one action (mirrors debug mode's breakpoint-only state). The container should shrink to fit the single icon — no empty padding on the main axis."
          collapsible
          defaultCollapsed={false}
          position="top-right"
        >
          <Column mt={12} gap={12}>
            <Column gap={4}>
              <span className="text-sm font-semibold">Position:</span>
              <Row gap={4} wrap="wrap">
                {POSITION_OPTIONS.map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={position === value ? 'default' : 'secondary'}
                    onClick={() => setPosition(value)}
                  >
                    {value}
                  </Button>
                ))}
              </Row>
            </Column>
            <Column gap={4}>
              <span className="text-sm font-semibold">Align:</span>
              <Row gap={4} wrap="wrap">
                {ALIGN_OPTIONS.map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={align === value ? 'default' : 'secondary'}
                    onClick={() => setAlign(value)}
                  >
                    {value}
                  </Button>
                ))}
              </Row>
            </Column>
          </Column>
        </StoryInfoPanel>
        <Panel position="bottom-right">
          <CanvasPositionControls translations={DefaultCanvasTranslations} />
        </Panel>
      </BaseCanvas>
    </BaseNodeOverrideConfigProvider>
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

export const OverflowMenu: Story = {
  name: 'Toolbar with Overflow Menu',
  render: () => <OverflowMenuStory />,
};

export const SingleAction: Story = {
  name: 'Single-action Toolbar',
  render: () => <SingleActionStory />,
};

export const CustomToolbarExtensions: Story = {
  name: 'Custom Toolbar Extensions',
  render: () => <CustomToolbarStory />,
};
