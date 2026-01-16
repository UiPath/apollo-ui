import { FontVariantToken } from '@uipath/apollo-core';
import {
  type Node,
  Panel,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { ApButton, ApTypography } from '@uipath/apollo-react/material';
import { ApIcon } from '@uipath/apollo-react/material/components';
import type React from 'react';
import { useCallback, useEffect, useMemo } from 'react';

import { useCanvasStore } from '../../stores/canvasStore';
import { DefaultResourceNodeTranslations } from '../../types';
import type { CanvasLevel } from '../../types/canvas.types';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import { createAddNodePreview } from '../AddNodePanel/createAddNodePreview';
import type { BaseNodeData, NodeDisplay, NodeRegistration } from '../BaseNode';
import { NodeRegistryProvider } from '../BaseNode/NodeRegistryProvider';
import { HierarchicalCanvas } from './HierarchicalCanvas';

const workflowNodeTypes = {
  start: {
    nodeType: 'start',
    displayName: 'Start',
    category: 'Basic',
    icon: 'play_circle',
    description: 'Entry point of the workflow',
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || 'Start',
      }),
      getIcon: () => <ApIcon variant="outlined" name="play_circle" size="40px" />,
      getHandleConfigurations: () => [
        {
          position: Position.Right,
          handles: [
            {
              id: 'output',
              type: 'source' as const,
              handleType: 'output' as const,
              showButton: true,
            },
          ],
        },
      ],
      getDefaultParameters: () => ({
        label: 'Start',
      }),
    },
    sortOrder: 1,
  },

  end: {
    nodeType: 'end',
    displayName: 'End',
    category: 'Basic',
    icon: 'stop_circle',
    description: 'Exit point of the workflow',
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || 'End',
      }),
      getIcon: () => <ApIcon variant="outlined" name="stop_circle" size="40px" />,
      getHandleConfigurations: () => [
        {
          position: Position.Left,
          handles: [
            {
              id: 'input',
              type: 'target' as const,
              handleType: 'input' as const,
            },
          ],
        },
      ],
      getDefaultParameters: () => ({
        label: 'End',
      }),
    },
    sortOrder: 2,
  },

  process: {
    nodeType: 'process',
    displayName: 'Process',
    category: 'Actions',
    icon: 'settings',
    description: 'A process or action step',
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || 'Process',
        subLabel: data.isDrillable ? '↓ Drillable' : undefined,
      }),
      getIcon: () => <ApIcon variant="outlined" name="settings" size="40px" />,
      getHandleConfigurations: () => [
        {
          position: Position.Left,
          handles: [
            {
              id: 'input',
              type: 'target' as const,
              handleType: 'input' as const,
            },
          ],
        },
        {
          position: Position.Right,
          handles: [
            {
              id: 'output',
              type: 'source' as const,
              handleType: 'output' as const,
              showButton: true,
            },
          ],
        },
      ],
      getDefaultParameters: () => ({
        label: 'Process',
        isDrillable: true,
        childCanvasId: null,
      }),
    },
    sortOrder: 10,
  },

  decision: {
    nodeType: 'decision',
    displayName: 'Decision',
    category: 'Logic',
    icon: 'help',
    description: 'A decision point with multiple paths',
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || 'Decision',
      }),
      getIcon: () => <ApIcon variant="outlined" name="help" size="40px" />,
      getHandleConfigurations: () => [
        {
          position: Position.Left,
          handles: [
            {
              id: 'input',
              type: 'target' as const,
              handleType: 'input' as const,
            },
          ],
        },
        {
          position: Position.Right,
          handles: [
            {
              id: 'output-true',
              type: 'source' as const,
              handleType: 'output' as const,
              label: 'True',
              showButton: true,
            },
            {
              id: 'output-false',
              type: 'source' as const,
              handleType: 'output' as const,
              label: 'False',
              showButton: true,
            },
          ],
        },
      ],
      getDefaultParameters: () => ({
        label: 'Decision',
        condition: '',
      }),
    },
    sortOrder: 20,
  },

  subprocess: {
    nodeType: 'subprocess',
    displayName: 'Sub-Process',
    category: 'Structure',
    icon: 'folder',
    description: 'A sub-process that contains its own workflow',
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || 'Sub-Process',
        subLabel: '⤵ Click to open',
        shape: 'square' as const,
      }),
      getIcon: () => <ApIcon variant="outlined" name="folder" size="40px" />,
      getHandleConfigurations: () => [
        {
          position: Position.Left,
          handles: [
            {
              id: 'input',
              type: 'target' as const,
              handleType: 'input' as const,
            },
          ],
        },
        {
          position: Position.Right,
          handles: [
            {
              id: 'output',
              type: 'source' as const,
              handleType: 'output' as const,
              showButton: true,
            },
          ],
        },
      ],
      getDefaultParameters: () => ({
        label: 'Sub-Process',
        isDrillable: true,
        childCanvasId: null,
      }),
      getToolbar: (data: BaseNodeData) => {
        const actions = [];
        if (data.isDrillable && data.childCanvasId) {
          actions.push({
            id: 'drill-in',
            icon: 'open_in_new',
            label: 'Open Sub-Process',
            onAction: async (nodeId: string) => {
              const store = useCanvasStore.getState();
              // Use the new drillIntoNode method for smooth animations
              await store.drillIntoNode(nodeId, true);
            },
          });
        }
        return {
          actions,
          overflowActions: [
            {
              id: 'delete',
              icon: 'delete',
              label: 'Delete',
              onAction: (_nodeId: string) => {
                /* Delete subprocess */
              },
            },
          ],
          // TODO: Localize
          overflowLabel: DefaultResourceNodeTranslations.moreOptions,
          position: 'top' as const,
          align: 'end' as const,
        };
      },
    },
    sortOrder: 40,
  },
};

// Convert to NodeRegistration array
const getNodeRegistrations = (): NodeRegistration[] => {
  return Object.values(workflowNodeTypes).map((type) => ({
    nodeType: type.nodeType,
    definition: type.definition,
    category: type.category,
    displayName: type.displayName,
    description: type.description,
    icon: type.icon,
    sortOrder: type.sortOrder,
    isVisible: true,
  }));
};

/**
 * Inner component that uses the ReactFlow hooks
 */
const CanvasWithControlsContent: React.FC = () => {
  const store = useCanvasStore();
  const reactFlowInstance = useReactFlow();
  const currentCanvas: CanvasLevel | undefined = useCanvasStore((state) => {
    const lastIndex = state.currentPath[state.currentPath.length - 1];
    return lastIndex !== undefined ? state.canvasStack[lastIndex] : undefined;
  });

  // Listen for handle action events and create preview
  useEffect(() => {
    const handleAction = (event: { nodeId: string; handleId: string }) => {
      if (reactFlowInstance) {
        createAddNodePreview(event.nodeId, event.handleId, reactFlowInstance);
      }
    };

    canvasEventBus.on('handle:action', handleAction);
    return () => {
      canvasEventBus.off('handle:action', handleAction);
    };
  }, [reactFlowInstance]);

  const handleAddNode = useCallback(
    (nodeType: string) => {
      const existingNodes =
        currentCanvas?.nodes.filter((n) => n.id !== 'blank-canvas-node').length || 0;
      const position = {
        x: 200 + (existingNodes % 3) * 250,
        y: 200 + Math.floor(existingNodes / 3) * 200,
      };

      // Remove blank canvas node if it exists
      const blankNode = currentCanvas?.nodes.find((n) => n.id === 'blank-canvas-node');
      if (blankNode) {
        store.removeNode('blank-canvas-node');
      }

      store.addNode(nodeType, position);
    },
    [store, currentCanvas]
  );

  const handleAddSampleWorkflow = useCallback(() => {
    // Clear existing nodes
    if (currentCanvas?.nodes) {
      currentCanvas.nodes.forEach((node: Node) => {
        store.removeNode(node.id);
      });
    }

    // Add a sample workflow
    const nodes = [
      { type: 'start', position: { x: 100, y: 100 } },
      { type: 'subprocess', position: { x: 300, y: 100 } },
      { type: 'decision', position: { x: 500, y: 100 } },
      { type: 'subprocess', position: { x: 600, y: 250 } },
      { type: 'end', position: { x: 700, y: 100 } },
    ];

    nodes.forEach((node, index) => {
      setTimeout(() => {
        store.addNode(node.type, node.position);
      }, index * 100);
    });
  }, [store, currentCanvas]);

  const handleClearCanvas = useCallback(() => {
    // Clear all nodes and edges
    if (currentCanvas?.nodes) {
      currentCanvas.nodes.forEach((node) => {
        store.removeNode(node.id);
      });
    }
    if (currentCanvas?.edges) {
      currentCanvas.edges.forEach((edge) => {
        store.removeEdge(edge.id);
      });
    }

    // Add back blank canvas node
    const blankNode: Node = {
      id: 'blank-canvas-node',
      type: 'blank-canvas-node',
      position: { x: 0, y: 0 },
      data: {},
    };

    store.updateNodes([blankNode]);
  }, [store, currentCanvas]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <HierarchicalCanvas mode="design" />

      {/* Control Panel */}
      <Panel position="center-right">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '8px',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minWidth: '180px',
          }}
        >
          <ApButton
            variant="secondary"
            label="Start"
            size="small"
            startIcon={<ApIcon variant="outlined" name="play_circle" />}
            onClick={() => handleAddNode('start')}
          />
          <ApButton
            variant="secondary"
            size="small"
            label="Process"
            startIcon={<ApIcon variant="outlined" name="settings" />}
            onClick={() => handleAddNode('process')}
          />
          <ApButton
            variant="secondary"
            size="small"
            label="Decision"
            startIcon={<ApIcon variant="outlined" name="help" />}
            onClick={() => handleAddNode('decision')}
          />
          <ApButton
            variant="secondary"
            size="small"
            label="Sub-Process"
            startIcon={<ApIcon variant="outlined" name="folder" />}
            onClick={() => handleAddNode('subprocess')}
          />
          <ApButton
            variant="secondary"
            size="small"
            label="End"
            startIcon={<ApIcon variant="outlined" name="stop_circle" />}
            onClick={() => handleAddNode('end')}
          />
          <ApButton
            variant="primary"
            size="small"
            label="Sample Workflow"
            startIcon={<ApIcon variant="outlined" name="auto_awesome" />}
            onClick={handleAddSampleWorkflow}
          />
          <ApButton
            variant="secondary"
            size="small"
            label="Clear Canvas"
            startIcon={<ApIcon name="clear" />}
            onClick={handleClearCanvas}
          />
        </div>
      </Panel>

      {/* Info Panel */}
      <Panel position="top-right">
        <div
          style={{
            padding: '12px',
            color: 'var(--uix-canvas-foreground)',
            backgroundColor: 'var(--uix-canvas-background)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '12px',
          }}
        >
          <ApTypography variant={FontVariantToken.fontSizeMBold}>Canvas Info</ApTypography>
          <div>Nodes: {currentCanvas?.nodes?.length || 0}</div>
          <div>Edges: {currentCanvas?.edges?.length || 0}</div>
          <div>Level: {store.currentPath.length}</div>
          <ApTypography variant={FontVariantToken.fontSizeMBold}>Instructions</ApTypography>
          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
            1. Add nodes or drag to create
            <br />
            2. Click + button on handles
            <br />
            3. Connect nodes
            <br />
            4. Double-click Sub-Process to drill in
          </div>
        </div>
      </Panel>
    </div>
  );
};

/**
 * HierarchicalCanvas with test controls for Storybook
 */
export const HierarchicalCanvasWithControls: React.FC = () => {
  const nodeRegistrations = useMemo(() => getNodeRegistrations(), []);

  return (
    <NodeRegistryProvider registrations={nodeRegistrations}>
      <ReactFlowProvider>
        <CanvasWithControlsContent />
      </ReactFlowProvider>
    </NodeRegistryProvider>
  );
};
