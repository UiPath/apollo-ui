import type { Meta, StoryObj } from '@storybook/react';
import {
  type Node,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { useCallback, useEffect, useMemo } from 'react';
import { ExecutionStatusContext } from '../../../hooks';
import { StoryInfoPanel, useCanvasStory } from '../../../storybook-utils';
import { DefaultCanvasTranslations } from '../../../types';
import { BaseCanvas } from '../../BaseCanvas';
import type { BaseNodeData, NodeRegistration, NodeShape } from '../../BaseNode/BaseNode.types';
import { NodeRegistryProvider } from '../../BaseNode/NodeRegistryProvider';
import { CanvasPositionControls } from '../../CanvasPositionControls';
import { ExecutionStatusIcon } from '../../ExecutionStatusIcon';

// ============================================================================
// Node Registration
// ============================================================================

const toolbarNodeRegistration: NodeRegistration = {
  nodeType: 'toolbarDemo',
  category: 'demo',
  displayName: 'Toolbar Demo Node',
  description: 'Node demonstrating toolbar functionality',
  icon: 'settings',
  definition: {
    getIcon: () => <ApIcon name="home" variant="outlined" size="40px" />,
    getDisplay: (data) => ({
      label: data.display?.label || 'Toolbar Demo',
      subLabel: data.display?.subLabel || 'Hover to see toolbar',
      shape: data.display?.shape || 'rectangle',
    }),
    getAdornments: (_data, context) => {
      const state = context.executionState;
      const status = typeof state === 'string' ? state : state?.status;
      return { topRight: <ExecutionStatusIcon status={status} /> };
    },
    getToolbar: (data) => ({
      actions: [
        {
          id: 'add',
          icon: 'add',
          label: 'Add',
          onAction: (nodeId) => console.log(`Add: ${nodeId}`),
        },
        {
          id: 'edit',
          icon: 'mode_edit',
          label: 'Edit',
          onAction: (nodeId) => console.log(`Edit: ${nodeId}`),
        },
        {
          id: 'delete',
          icon: 'delete',
          label: 'Delete',
          onAction: (nodeId) => console.log(`Delete: ${nodeId}`),
        },
      ],
      overflowActions: [
        {
          id: 'duplicate',
          icon: 'content_copy',
          label: 'Duplicate',
          onAction: (nodeId) => console.log(`Duplicate: ${nodeId}`),
        },
        {
          id: 'settings',
          icon: 'settings',
          label: 'Settings',
          onAction: (nodeId) => console.log(`Settings: ${nodeId}`),
        },
      ],
      overflowLabel: 'More options',
      position: (data?.parameters?.toolbarPosition as 'top' | 'bottom' | 'left' | 'right') || 'top',
      align: (data?.parameters?.toolbarAlign as 'start' | 'center' | 'end') || 'end',
    }),
  },
};

const createToggleButtonNodeRegistration = (
  onToggle: (nodeId: string, actionId: string, newState: boolean) => void
): NodeRegistration => ({
  nodeType: 'toggleDemo',
  category: 'demo',
  displayName: 'Toggle Button Demo',
  description: 'Node demonstrating toggle button functionality',
  icon: 'toggle_on',
  definition: {
    getIcon: () => <ApIcon name="home" variant="outlined" size="40px" />,
    getDisplay: (data) => ({
      label: data.display?.label || 'Toggle Demo',
      subLabel: data.display?.subLabel || 'Toggle buttons with state',
      shape: 'rectangle',
    }),
    getToolbar: (data) => ({
      actions: [
        {
          id: 'visibility',
          icon: data.parameters?.visibilityOn ? 'visibility_off' : 'visibility',
          label: data.parameters?.visibilityOn ? 'Turn Visibility Off' : 'Turn Visibility On',
          isToggled: data.parameters?.visibilityOn as boolean,
          onAction: (nodeId) => {
            const currentState = data.parameters?.visibilityOn as boolean;
            onToggle(nodeId, 'visibility', !currentState);
          },
        },
        {
          id: 'lock',
          icon: data.parameters?.lockOn ? 'lock_open' : 'lock',
          label: data.parameters?.lockOn ? 'Unlock' : 'Lock',
          isToggled: data.parameters?.lockOn as boolean,
          onAction: (nodeId) => {
            const currentState = data.parameters?.lockOn as boolean;
            onToggle(nodeId, 'lock', !currentState);
          },
        },
        { id: 'separator' },
        {
          id: 'edit',
          icon: 'mode_edit',
          label: 'Edit',
          onAction: (nodeId) => console.log(`Edit: ${nodeId}`),
        },
      ],
      position: 'top',
      align: 'end',
    }),
  },
});

const pinnedActionsNodeRegistration: NodeRegistration = {
  nodeType: 'pinnedDemo',
  category: 'demo',
  displayName: 'Pinned Actions Demo',
  description: 'Node demonstrating pinned actions that remain visible',
  icon: 'push_pin',
  definition: {
    getIcon: () => <ApIcon name="home" variant="outlined" size="40px" />,
    getDisplay: (data) => ({
      label: data.display?.label || 'Pinned Demo',
      subLabel: data.display?.subLabel || 'Pinned actions always visible',
      shape: data.display?.shape || 'rectangle',
    }),
    getToolbar: (data) => ({
      actions: [
        {
          id: 'edit',
          icon: 'mode_edit',
          label: 'Edit',
          isPinned: true,
          onAction: (nodeId) => console.log(`Edit: ${nodeId}`),
        },
        {
          id: 'swap',
          icon: 'swap_horiz',
          label: 'Swap',
          onAction: (nodeId) => console.log(`Swap: ${nodeId}`),
        },
        { id: 'separator' },
        {
          id: 'delete',
          icon: 'delete',
          label: 'Delete',
          onAction: (nodeId) => console.log(`Delete: ${nodeId}`),
        },
      ],
      // overflowActions: [
      //   {
      //     id: "settings",
      //     icon: "settings",
      //     label: "Settings",
      //     onAction: (nodeId) => console.log(`Settings: ${nodeId}`),
      //   },
      // ],
      position: (data?.parameters?.toolbarPosition as 'top' | 'bottom' | 'left' | 'right') || 'top',
      align: (data?.parameters?.toolbarAlign as 'start' | 'center' | 'end') || 'end',
    }),
  },
};

const createCustomColorNodeRegistration = (
  onToggle: (nodeId: string, actionId: string, newState: boolean) => void
): NodeRegistration => ({
  nodeType: 'customColorDemo',
  category: 'demo',
  displayName: 'Custom Color Demo',
  description: 'Node demonstrating custom colored buttons',
  icon: 'palette',
  definition: {
    getIcon: () => <ApIcon name="home" variant="outlined" size="40px" />,
    getDisplay: (data) => ({
      label: data.display?.label || 'Custom Colors',
      subLabel: data.display?.subLabel || 'Colored buttons with hover effects',
      shape: 'rectangle',
    }),
    getToolbar: (data) => ({
      actions: [
        {
          id: 'favorite',
          icon: 'favorite',
          label: 'Favorite (Red hex)',
          color: '#E53935',
          isToggled: data.parameters?.favoriteOn as boolean,
          onAction: (nodeId) => {
            const currentState = data.parameters?.favoriteOn as boolean;
            onToggle(nodeId, 'favorite', !currentState);
          },
        },
        {
          id: 'bookmark',
          icon: 'bookmark',
          label: 'Bookmark (Blue rgb)',
          color: 'rgb(30, 136, 229)',
          isToggled: data.parameters?.bookmarkOn as boolean,
          onAction: (nodeId) => {
            const currentState = data.parameters?.bookmarkOn as boolean;
            onToggle(nodeId, 'bookmark', !currentState);
          },
        },
        {
          id: 'star',
          icon: 'star',
          label: 'Star (Orange hsl)',
          color: 'hsl(43, 100%, 50%)',
          isToggled: data.parameters?.starOn as boolean,
          onAction: (nodeId) => {
            const currentState = data.parameters?.starOn as boolean;
            onToggle(nodeId, 'star', !currentState);
          },
        },
        { id: 'separator' },
        {
          id: 'check',
          icon: 'check_circle',
          label: 'Check (Green var)',
          color: 'var(--uix-canvas-success-icon)',
          onAction: (nodeId) => console.log(`Check: ${nodeId}`),
        },
        {
          id: 'default',
          icon: 'settings',
          label: 'Default (No color)',
          onAction: (nodeId) => console.log(`Settings: ${nodeId}`),
        },
      ],
      position: 'top',
      align: 'end',
    }),
  },
});

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

      // Create a toggle handler that works with ReactFlow
      const StoryWrapper = () => {
        const { setNodes } = useReactFlow();

        const handleToggle = useCallback(
          (nodeId: string, actionId: string, newState: boolean) => {
            setNodes((nodes) =>
              nodes.map((node) => {
                if (node.id !== nodeId) return node;
                const nodeData = node.data as BaseNodeData;
                // Determine the parameter key based on action ID
                const paramKey =
                  actionId === 'visibility'
                    ? 'visibilityOn'
                    : actionId === 'lock'
                      ? 'lockOn'
                      : `${actionId}On`;
                return {
                  ...node,
                  data: {
                    ...nodeData,
                    parameters: {
                      ...(nodeData.parameters || {}),
                      [paramKey]: newState,
                    },
                  },
                };
              })
            );
          },
          [setNodes]
        );

        const registrations = useMemo(
          () => [
            toolbarNodeRegistration,
            pinnedActionsNodeRegistration,
            createToggleButtonNodeRegistration(handleToggle),
            createCustomColorNodeRegistration(handleToggle),
          ],
          [handleToggle]
        );

        return (
          <NodeRegistryProvider registrations={registrations}>
            <Story />
          </NodeRegistryProvider>
        );
      };

      return (
        <ExecutionStatusContext.Provider value={executions}>
          <ReactFlowProvider>
            <div style={{ height: '100vh', width: '100vw' }}>
              <StoryWrapper />
            </div>
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
const ALIGNS = ['start', 'center', 'end'] as const;

function createToolbarNodes(
  position: 'top' | 'bottom' | 'left' | 'right' = 'top'
): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  SHAPES.forEach((shape, rowIndex) => {
    ALIGNS.forEach((align, colIndex) => {
      nodes.push({
        id: `${shape}-${align}`,
        type: 'toolbarDemo',
        position: { x: 96 + colIndex * 300, y: 192 + rowIndex * 200 },
        data: {
          parameters: { toolbarAlign: align, toolbarPosition: position },
          display: {
            label: shape.charAt(0).toUpperCase() + shape.slice(1),
            subLabel: `align: ${align}`,
            shape,
          },
        },
      });
    });
  });

  return nodes;
}

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory({ position }: { position?: 'top' | 'bottom' | 'left' | 'right' }) {
  const initialNodes = useMemo(() => createToolbarNodes(position), [position]);
  const { canvasProps, setNodes } = useCanvasStory({ initialNodes });

  // Update nodes when position changes
  useEffect(() => {
    const updatedNodes = createToolbarNodes(position);
    setNodes(updatedNodes);
  }, [position, setNodes]);

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel title="Node Toolbar" description="Hover over nodes to see toolbar actions" />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function ToggleButtonStory() {
  const initialNodes = useMemo(
    () => [
      {
        id: 'toggle-1',
        type: 'toggleDemo',
        position: { x: 250, y: 250 },
        data: {
          parameters: { visibilityOn: true, lockOn: false },
          display: {
            label: 'Toggle Demo 1',
            subLabel: 'Click buttons to toggle state',
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
        title="Toggle Buttons"
        description="Click toggle buttons to change their state. Visibility and Lock icons respond to clicks."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function PinnedActionsStory() {
  const initialNodes = useMemo(() => {
    const positions: Array<'top' | 'bottom' | 'left' | 'right'> = [
      'top',
      'bottom',
      'left',
      'right',
    ];
    return positions.map((position, i) => ({
      id: `pinned-${position}`,
      type: 'pinnedDemo',
      position: { x: 250 + (i % 2) * 400, y: 250 + Math.floor(i / 2) * 300 },
      data: {
        parameters: { toolbarPosition: position, toolbarAlign: 'end', starOn: true },
        display: {
          label: `Pinned ${position}`,
          subLabel: 'Deselect to see badge',
          shape: 'rectangle',
        },
      },
    }));
  }, []);

  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel
        title="Pinned Actions"
        description="Deselect nodes to see pinned badge. Select to see full toolbar expand. Click star to toggle."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function CustomColorsStory() {
  const initialNodes = useMemo(
    () => [
      {
        id: 'custom-colors-1',
        type: 'customColorDemo',
        position: { x: 350, y: 350 },
        data: {
          parameters: { favoriteOn: true, bookmarkOn: false, starOn: true },
          display: {
            label: 'Custom Colored Buttons',
            subLabel: 'Hover to see lighter background',
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
        title="Custom Colors"
        description="Buttons with custom colors. Click to toggle. Icon color matches the provided color, hover shows lighter background, toggled state shows colored underline."
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
  name: 'Default',
  args: { position: 'top' },
  argTypes: {
    position: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
    },
  },
  render: (args) => <DefaultStory {...args} />,
};

export const PinnedActions: Story = {
  name: 'Pinned Actions',
  render: () => <PinnedActionsStory />,
};

export const ToggleButtons: Story = {
  name: 'Toggle Buttons',
  render: () => <ToggleButtonStory />,
};

export const CustomColors: Story = {
  name: 'Custom Colors',
  render: () => <CustomColorsStory />,
};
