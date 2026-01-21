import { FontVariantToken } from '@uipath/apollo-core';
import {
  type Node,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { ApButton, ApTypography } from '@uipath/apollo-react/material';
import { ApIcon } from '@uipath/apollo-react/material/components';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { NodeManifest } from '../../schema/node-definition/node-manifest';
import {
  selectAddNode,
  selectCurrentCanvas,
  selectCurrentPathLength,
  selectRemoveEdge,
  selectRemoveNode,
  selectUpdateNodes,
  useCanvasStore,
} from '../../stores/canvasStore';
import type { CanvasLevel } from '../../types/canvas.types';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import { createAddNodePreview } from '../AddNodePanel/createAddNodePreview';
import { NodeRegistryProvider } from '../BaseNode/NodeRegistryProvider';
import { HierarchicalCanvas } from './HierarchicalCanvas';

// Demo canvas data for Storybook testing
const createDemoCanvases = (): Record<string, CanvasLevel> => {
  const rootCanvas: CanvasLevel = {
    id: 'root',
    name: 'Main Workflow',
    nodes: [
      {
        type: 'blank-canvas-node',
        position: { x: 500, y: 500 },
        id: 'blank-canvas-node',
        data: {
          label: 'Start Here',
        },
      },
    ],
    edges: [],
    nodeTypes: ['default'],
    edgeTypes: ['default'],
    viewport: { x: 0, y: 0, zoom: 1 },
    selection: {
      isSingleNodeSelected: false,
      isSingleEdgeSelected: false,
      nodeIds: [],
      edgeIds: [],
    },
    options: {},
    properties: {},
  };

  return {
    root: rootCanvas,
  };
};

// ============================================================================
// Workflow Node Manifests
// ============================================================================

const workflowManifests: NodeManifest[] = [
  {
    nodeType: 'start',
    version: '1.0.0',
    category: 'Basic',
    tags: ['workflow', 'basic'],
    sortOrder: 1,
    display: {
      label: 'Start',
      icon: 'play_circle',
      shape: 'circle',
    },
    handleConfiguration: [
      {
        position: 'right',
        handles: [
          {
            id: 'output',
            type: 'source',
            handleType: 'output',
            showButton: true,
          },
        ],
      },
    ],
  },
  {
    nodeType: 'end',
    version: '1.0.0',
    category: 'Basic',
    tags: ['workflow', 'basic'],
    sortOrder: 2,
    display: {
      label: 'End',
      icon: 'stop_circle',
      shape: 'circle',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [
          {
            id: 'input',
            type: 'target',
            handleType: 'input',
          },
        ],
      },
    ],
  },
  {
    nodeType: 'process',
    version: '1.0.0',
    category: 'Actions',
    tags: ['workflow', 'action'],
    sortOrder: 10,
    display: {
      label: 'Process',
      icon: 'settings',
      shape: 'rectangle',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [
          {
            id: 'input',
            type: 'target',
            handleType: 'input',
          },
        ],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'output',
            type: 'source',
            handleType: 'output',
            showButton: true,
          },
        ],
      },
    ],
  },
  {
    nodeType: 'decision',
    version: '1.0.0',
    category: 'Logic',
    tags: ['workflow', 'logic'],
    sortOrder: 20,
    display: {
      label: 'Decision',
      icon: 'help',
      shape: 'square',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [
          {
            id: 'input',
            type: 'target',
            handleType: 'input',
          },
        ],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'output-true',
            type: 'source',
            handleType: 'output',
            label: 'True',
            showButton: true,
          },
          {
            id: 'output-false',
            type: 'source',
            handleType: 'output',
            label: 'False',
            showButton: true,
          },
        ],
      },
    ],
  },
  {
    nodeType: 'subprocess',
    version: '1.0.0',
    category: 'Structure',
    tags: ['workflow', 'structure'],
    sortOrder: 40,
    display: {
      label: 'Sub-Process',
      icon: 'folder',
      shape: 'square',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [
          {
            id: 'input',
            type: 'target',
            handleType: 'input',
          },
        ],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'output',
            type: 'source',
            handleType: 'output',
            showButton: true,
          },
        ],
      },
    ],
    toolbarExtensions: {
      design: {
        actions: [{ id: 'drill-in', icon: 'open_in_new', label: 'Open Sub-Process' }],
      },
    },
  },
];

interface CanvasWithControlsContentProps {
  initialCanvases: Record<string, CanvasLevel>;
  initialPath: string[];
  onCanvasesChange: (canvases: Record<string, CanvasLevel>) => void;
  onPathChange: (path: string[]) => void;
}

/**
 * Inner component that uses the ReactFlow hooks
 */
const CanvasWithControlsContent: React.FC<CanvasWithControlsContentProps> = ({
  initialCanvases,
  initialPath,
  onCanvasesChange,
  onPathChange,
}) => {
  const reactFlowInstance = useReactFlow();

  // Use stable selectors to avoid "getSnapshot should be cached" errors
  const currentCanvas = useCanvasStore(selectCurrentCanvas);
  const currentPathLength = useCanvasStore(selectCurrentPathLength);
  const addNode = useCanvasStore(selectAddNode);
  const removeNode = useCanvasStore(selectRemoveNode);
  const removeEdge = useCanvasStore(selectRemoveEdge);
  const updateNodes = useCanvasStore(selectUpdateNodes);

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
        removeNode('blank-canvas-node');
      }

      addNode(nodeType, position);
    },
    [addNode, removeNode, currentCanvas]
  );

  const handleAddSampleWorkflow = useCallback(() => {
    // Clear existing nodes
    if (currentCanvas?.nodes) {
      currentCanvas.nodes.forEach((node: Node) => {
        removeNode(node.id);
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
        addNode(node.type, node.position);
      }, index * 100);
    });
  }, [addNode, removeNode, currentCanvas]);

  const handleClearCanvas = useCallback(() => {
    // Clear all nodes and edges
    if (currentCanvas?.nodes) {
      currentCanvas.nodes.forEach((node) => {
        removeNode(node.id);
      });
    }
    if (currentCanvas?.edges) {
      currentCanvas.edges.forEach((edge) => {
        removeEdge(edge.id);
      });
    }

    // Add back blank canvas node
    const blankNode: Node = {
      id: 'blank-canvas-node',
      type: 'blank-canvas-node',
      position: { x: 0, y: 0 },
      data: {},
    };

    updateNodes([blankNode]);
  }, [removeNode, removeEdge, updateNodes, currentCanvas]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <HierarchicalCanvas
        mode="design"
        initialCanvases={initialCanvases}
        initialPath={initialPath}
        onCanvasesChange={onCanvasesChange}
        onPathChange={onPathChange}
      />

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
          <div>Level: {currentPathLength}</div>
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
 * HierarchicalCanvas with test controls for Storybook.
 * Demonstrates the uncontrolled-with-callbacks pattern for consuming HierarchicalCanvas.
 *
 * Usage pattern:
 * - initialCanvases/initialPath: Set once on mount, ignored after
 * - onCanvasesChange: Called on every change - use for persistence/sync
 * - onPathChange: Called on navigation - use for URL sync, analytics, etc.
 */
export const HierarchicalCanvasWithControls: React.FC = () => {
  // Initial data - only used on first render
  const [initialCanvases] = useState<Record<string, CanvasLevel>>(() => createDemoCanvases());
  const [initialPath] = useState<string[]>(['root']);

  // Callbacks for persistence - these receive updates but don't control the component
  const handleCanvasesChange = useCallback((canvases: Record<string, CanvasLevel>) => {
    // Example: persist to localStorage, send to API, etc.
    console.log('Canvas data changed:', Object.keys(canvases));
    // localStorage.setItem('workflow-canvases', JSON.stringify(canvases));
  }, []);

  const handlePathChange = useCallback((path: string[]) => {
    // Example: update URL, track analytics, etc.
    console.log('Navigation path changed:', path);
    // window.history.pushState({}, '', `?path=${path.join('/')}`);
  }, []);

  return (
    <NodeRegistryProvider registrations={workflowManifests}>
      <ReactFlowProvider>
        <CanvasWithControlsContent
          initialCanvases={initialCanvases}
          initialPath={initialPath}
          onCanvasesChange={handleCanvasesChange}
          onPathChange={handlePathChange}
        />
      </ReactFlowProvider>
    </NodeRegistryProvider>
  );
};
