import {
  type Node,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { Button } from '@uipath/apollo-wind';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { NodeRegistryProvider } from '../../core';
import type { CategoryManifest } from '../../schema/node-definition';
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
import { CanvasIcon } from '../../utils/icon-registry';
import { createAddNodePreview } from '../AddNodePanel/createAddNodePreview';
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
// Category Manifests
// ============================================================================

const workflowCategories: CategoryManifest[] = [
  {
    id: 'Basic',
    name: 'Basic',
    sortOrder: 0,
    color: 'linear-gradient(135deg, #FAFAFB 0%, #ECEDEF 100%)',
    colorDark: 'linear-gradient(135deg, #526069 0%, rgba(50, 60, 66, 0.6) 100%)',
    icon: 'boxes',
    tags: ['basic', 'fundamental'],
  },
  {
    id: 'Actions',
    name: 'Actions',
    sortOrder: 1,
    color: 'linear-gradient(135deg, #FAFAFB 0%, #ECEDEF 100%)',
    colorDark: 'linear-gradient(135deg, #526069 0%, rgba(50, 60, 66, 0.6) 100%)',
    icon: 'zap',
    tags: ['action', 'activity'],
  },
  {
    id: 'Logic',
    name: 'Logic',
    sortOrder: 2,
    color: 'linear-gradient(135deg, #FAFAFB 0%, #ECEDEF 100%)',
    colorDark: 'linear-gradient(135deg, #526069 0%, rgba(50, 60, 66, 0.6) 100%)',
    icon: 'workflow',
    tags: ['logic', 'decision'],
  },
  {
    id: 'Structure',
    name: 'Structure',
    sortOrder: 3,
    color: 'linear-gradient(135deg, #FAFAFB 0%, #ECEDEF 100%)',
    colorDark: 'linear-gradient(135deg, #526069 0%, rgba(50, 60, 66, 0.6) 100%)',
    icon: 'layers',
    tags: ['structure', 'organization'],
  },
];

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
      icon: 'circle-play',
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
      icon: 'circle-stop',
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
      icon: 'split',
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
        actions: [{ id: 'drill-in', icon: 'external-link', label: 'Open Sub-Process' }],
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
 * Complete workflow manifest with categories and nodes
 */
const workflowManifest = {
  version: '1.0.0',
  categories: workflowCategories,
  nodes: workflowManifests,
};

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
          <Button variant="secondary" size="sm" onClick={() => handleAddNode('start')}>
            <CanvasIcon icon="circle-play" size={16} /> Start
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleAddNode('process')}>
            <CanvasIcon icon="settings" size={16} /> Process
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleAddNode('decision')}>
            <CanvasIcon icon="circle-question-mark" size={16} /> Decision
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleAddNode('subprocess')}>
            <CanvasIcon icon="folder" size={16} /> Sub-Process
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleAddNode('end')}>
            <CanvasIcon icon="circle-stop" size={16} /> End
          </Button>
          <Button size="sm" onClick={handleAddSampleWorkflow}>
            <CanvasIcon icon="sparkles" size={16} /> Sample Workflow
          </Button>
          <Button variant="secondary" size="sm" onClick={handleClearCanvas}>
            <CanvasIcon icon="x" size={16} /> Clear Canvas
          </Button>
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
          <span className="text-sm font-bold">Canvas Info</span>
          <div>Nodes: {currentCanvas?.nodes?.length || 0}</div>
          <div>Edges: {currentCanvas?.edges?.length || 0}</div>
          <div>Level: {currentPathLength}</div>
          <span className="text-sm font-bold">Instructions</span>
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
    <NodeRegistryProvider manifest={workflowManifest}>
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
