import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CanvasLevel } from "../types/canvas.types";
import type { Node, Edge, Viewport } from "@uipath/uix/xyflow/react";

interface CanvasStore {
  canvasStack: Record<string, CanvasLevel>;
  currentPath: string[]; // list of canvas IDs representing the current path

  // Actions
  initializeCanvas: () => void;
  navigateToCanvas: (targetCanvasId: string, sourceViewport?: Viewport) => void; // Navigate to a specific canvas
  navigateToDepth: (depth: number) => void; // Navigate to a specific depth in current path
  addNode: (nodeType: string, position?: { x: number; y: number }) => string; // Add a new node, returns node ID
  addNodeToCanvas: (node: Node) => void; // Add a pre-built node to canvas
  createChildCanvas: (parentNodeId: string, childCanvasId: string, name: string) => void; // Create child canvas for drillable node
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  updateNode: (node: Node) => void; // Update a single node
  updateNodes: (nodes: Node[]) => void;
  updateEdges: (edges: Edge[]) => void;
  updateSelection: (nodeIds: string[], edgeIds: string[]) => void;
  updateViewport: (viewport: Viewport, canvasId?: string) => void;

  // Getters
  getCurrentCanvas: () => CanvasLevel | undefined;
  getBreadcrumbs: () => { id: string; name: string }[];
}

// Optimized selectors for preventing unnecessary re-renders
export const selectCurrentCanvas = (state: CanvasStore): CanvasLevel | undefined => {
  const currentCanvasId = state.currentPath[state.currentPath.length - 1];
  return currentCanvasId ? state.canvasStack[currentCanvasId] : undefined;
};

export const selectPreviousCanvas = (state: CanvasStore): CanvasLevel | undefined => {
  const previousIndex = state.currentPath.length - 2;
  if (previousIndex < 0) return undefined;
  const previousCanvasId = state.currentPath[previousIndex];
  return previousCanvasId ? state.canvasStack[previousCanvasId] : undefined;
};

export const selectBreadcrumbs = (state: CanvasStore) => {
  return state.currentPath.map((canvasId) => {
    const canvas = state.canvasStack[canvasId];
    return {
      id: canvasId,
      name: canvas?.name || canvasId,
    };
  });
};

export const selectCanvasActions = (state: CanvasStore) => ({
  navigateToCanvas: state.navigateToCanvas,
  navigateToDepth: state.navigateToDepth,
  addNode: state.addNode,
  addNodeToCanvas: state.addNodeToCanvas,
  createChildCanvas: state.createChildCanvas,
  updateNode: state.updateNode,
  removeNode: state.removeNode,
  updateNodes: state.updateNodes,
  updateEdges: state.updateEdges,
  updateSelection: state.updateSelection,
  updateViewport: state.updateViewport,
});

const createDemoCanvases = (): Record<string, CanvasLevel> => {
  const rootCanvas: CanvasLevel = {
    id: "root",
    name: "Main Workflow",
    nodes: [
      {
        type: "blank-canvas-node",
        position: { x: 500, y: 500 },
        id: "blank-canvas-node",
        data: {
          label: "Start Here",
        },
      },
    ],
    edges: [],
    nodeTypes: ["default"],
    edgeTypes: ["default"],
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

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      canvasStack: {},
      currentPath: [],

      // Actions
      initializeCanvas: () => {
        set({
          canvasStack: createDemoCanvases(),
          currentPath: ["root"],
        });
      },

      navigateToCanvas: (targetCanvasId: string, sourceViewport?: Viewport) => {
        const state = get();
        const targetCanvas = state.canvasStack[targetCanvasId];

        if (!targetCanvas) {
          return;
        }

        // Save viewport of current canvas if provided
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];
        const updatedCanvasStack = { ...state.canvasStack };

        if (sourceViewport && currentCanvasId && state.canvasStack[currentCanvasId]) {
          updatedCanvasStack[currentCanvasId] = {
            ...state.canvasStack[currentCanvasId],
            viewport: sourceViewport,
          };
        }

        // Add the target canvas to the current path
        set({
          canvasStack: updatedCanvasStack,
          currentPath: [...state.currentPath, targetCanvasId],
        });
      },

      addNode: (nodeType: string, position?: { x: number; y: number }) => {
        // Deprecated: Use addNodeToCanvas with registry injection from useCanvasStoreActions
        // This method is kept for backward compatibility but should not be used directly
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId) return "";

        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return "";

        // Generate unique node ID
        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Check if this is a drillable node type
        const isDrillable = nodeType === "subprocess" || nodeType === "process" || nodeType === "loop";

        // Set default params based on node type
        const defaultParams = {
          label: nodeType === "subprocess" ? "Sub-Process" : nodeType === "process" ? "Process" : "New Node",
          isDrillable,
        };

        // Calculate position if not provided
        const nodePosition = position || {
          x: 100 + ((currentCanvas.nodes.length * 50) % 400),
          y: 100 + Math.floor(currentCanvas.nodes.length / 8) * 100,
        };

        // Create new node
        const newNode: Node = {
          id: nodeId,
          type: nodeType, // Use the actual node type
          position: nodePosition,
          data: {
            ...defaultParams,
            nodeType, // Store the type in data for reference
            parameters: defaultParams, // Store parameters for the node
            isDrillable, // Add at top level for toolbar to check
            childCanvasId: isDrillable ? `canvas-${nodeId}` : null, // Pre-generate child canvas ID
          },
        };

        // Check if this is a drillable node and prepare child canvas
        const updatedCanvasStack = { ...state.canvasStack };

        if (isDrillable) {
          const childCanvasId = `canvas-${nodeId}`;
          // Creating child canvas for drillable node

          newNode.data = {
            ...newNode.data,
            isDrillable: true, // Ensure isDrillable is in the data
            childCanvasId,
          };

          // Create the child canvas
          const childCanvas: CanvasLevel = {
            id: childCanvasId,
            name: (defaultParams as any)?.label || "Sub-Process",
            nodes: [],
            edges: [],
            nodeTypes: currentCanvas.nodeTypes, // Inherit parent's node types
            edgeTypes: currentCanvas.edgeTypes,
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

          // Adding child canvas to stack
          // Add child canvas to the updated stack
          updatedCanvasStack[childCanvasId] = childCanvas;
        }

        // Add node to current canvas
        const updatedNodes = [...currentCanvas.nodes, newNode];

        // Update both the current canvas nodes AND the child canvas (if created) in one update
        updatedCanvasStack[currentCanvasId] = {
          ...currentCanvas,
          nodes: updatedNodes,
        };

        set({
          canvasStack: updatedCanvasStack,
        });

        return nodeId;
      },

      addNodeToCanvas: (node: Node) => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId) return;

        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return;

        set({
          canvasStack: {
            ...state.canvasStack,
            [currentCanvasId]: {
              ...currentCanvas,
              nodes: [...currentCanvas.nodes, node],
            },
          },
        });
      },

      createChildCanvas: (parentNodeId: string, childCanvasId: string, name: string) => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId) return;

        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return;

        // Create the child canvas
        const childCanvas: CanvasLevel = {
          id: childCanvasId,
          name,
          nodes: [],
          edges: [],
          nodeTypes: currentCanvas.nodeTypes,
          edgeTypes: currentCanvas.edgeTypes,
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

        // Update parent node to include child canvas reference
        const updatedNodes = currentCanvas.nodes.map((node) =>
          node.id === parentNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  isDrillable: true,
                  childCanvasId,
                },
              }
            : node
        );

        set({
          canvasStack: {
            ...state.canvasStack,
            [currentCanvasId]: {
              ...currentCanvas,
              nodes: updatedNodes,
            },
            [childCanvasId]: childCanvas,
          },
        });
      },

      updateNode: (updatedNode: Node) => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId) return;

        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return;

        const updatedNodes = currentCanvas.nodes.map((node) => (node.id === updatedNode.id ? updatedNode : node));

        set({
          canvasStack: {
            ...state.canvasStack,
            [currentCanvasId]: {
              ...currentCanvas,
              nodes: updatedNodes,
            },
          },
        });
      },

      removeNode: (nodeId: string) => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId || typeof currentCanvasId !== "string") return;

        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return;

        const updatedNodes = currentCanvas.nodes.filter((n) => n.id !== nodeId);

        set({
          canvasStack: {
            ...state.canvasStack,
            [currentCanvasId]: {
              ...currentCanvas,
              nodes: updatedNodes,
            },
          },
        });
      },

      removeEdge: (edgeId: string) => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId || typeof currentCanvasId !== "string") return;
        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return;

        const updatedEdges = currentCanvas.edges.filter((e) => e.id !== edgeId);
        set({
          canvasStack: {
            ...state.canvasStack,
            [currentCanvasId]: {
              ...currentCanvas,
              edges: updatedEdges,
            },
          },
        });
      },

      navigateToDepth: (depth: number) => {
        const state = get();

        // Ensure depth is valid
        if (depth < 0 || depth >= state.currentPath.length) return;

        // Navigate to the specified depth by truncating the path
        set({
          currentPath: state.currentPath.slice(0, depth + 1),
        });
      },

      updateNodes: (nodes: Node[]) => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId || typeof currentCanvasId !== "string") return;

        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return;

        set({
          canvasStack: {
            ...state.canvasStack,
            [currentCanvasId]: {
              ...currentCanvas,
              nodes,
            },
          },
        });
      },

      updateEdges: (edges: Edge[]) => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId || typeof currentCanvasId !== "string") return;

        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return;

        set({
          canvasStack: {
            ...state.canvasStack,
            [currentCanvasId]: {
              ...currentCanvas,
              edges,
            },
          },
        });
      },

      updateSelection: (nodeIds: string[], edgeIds: string[]) => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId || typeof currentCanvasId !== "string") return;

        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return;

        set({
          canvasStack: {
            ...state.canvasStack,
            [currentCanvasId]: {
              ...currentCanvas,
              selection: {
                isSingleNodeSelected: nodeIds.length === 1 && edgeIds.length === 0,
                isSingleEdgeSelected: edgeIds.length === 1 && nodeIds.length === 0,
                nodeIds,
                edgeIds,
              },
            },
          },
        });
      },

      updateViewport: (viewport: Viewport, canvasId?: string) => {
        const state = get();
        const targetCanvasId = canvasId || state.currentPath[state.currentPath.length - 1];

        if (!targetCanvasId || typeof targetCanvasId !== "string") return;

        const targetCanvas = state.canvasStack[targetCanvasId];
        if (!targetCanvas) return;

        set({
          canvasStack: {
            ...state.canvasStack,
            [targetCanvasId]: {
              ...targetCanvas,
              viewport,
            },
          },
        });
      },

      // Getters
      getCurrentCanvas: () => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];
        return currentCanvasId ? state.canvasStack[currentCanvasId] : undefined;
      },

      getBreadcrumbs: () => {
        const state = get();
        return state.currentPath.map((canvasId) => {
          const canvas = state.canvasStack[canvasId];
          return {
            id: canvasId,
            name: canvas?.name || canvasId,
          };
        });
      },
    }),
    { trace: true }
  )
);
