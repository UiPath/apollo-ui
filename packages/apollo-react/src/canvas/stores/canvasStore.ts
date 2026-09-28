import type { Edge, Node, Viewport } from '@uipath/apollo-react/canvas/xyflow/react';
import { createSelector } from 'reselect';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CanvasLevel } from '../types/canvas.types';
import { animatedViewportManager, type TransitionState } from './animatedViewportManager';

interface CanvasStore {
  canvasStack: Record<string, CanvasLevel>;
  currentPath: string[]; // list of canvas IDs representing the current path
  transitionState: TransitionState; // Current animation transition state

  // Actions
  initializeCanvas: () => void;
  initializeWithData: (canvases: Record<string, CanvasLevel>, initialPath?: string[]) => void; // Initialize with external data
  navigateToCanvas: (
    targetCanvasId: string,
    sourceViewport?: Viewport,
    animated?: boolean
  ) => Promise<void>; // Navigate to a specific canvas
  navigateToDepth: (depth: number, animated?: boolean) => Promise<void>; // Navigate to a specific depth in current path
  drillIntoNode: (nodeId: string, animated?: boolean) => Promise<void>; // Drill into a specific node with animation
  navigateToSiblingCanvas: (targetCanvasId: string, animated?: boolean) => Promise<void>; // Navigate to a sibling canvas (replace last path item)
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
  updateTransitionState: (state: Partial<TransitionState>) => void; // Update animation state

  // Getters
  getCurrentCanvas: () => CanvasLevel | undefined;
  getBreadcrumbs: () => { id: string; name: string }[];
  getNodeById: (nodeId: string, canvasId?: string) => Node | undefined; // Get node by ID
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

// Memoized breadcrumbs selector using reselect
export const selectBreadcrumbs = createSelector(
  [(state: CanvasStore) => state.currentPath, (state: CanvasStore) => state.canvasStack],
  (currentPath, canvasStack) => {
    return currentPath.map((canvasId) => {
      const canvas = canvasStack[canvasId];
      return {
        id: canvasId,
        name: canvas?.name || canvasId,
      };
    });
  }
);

export const selectCanvasActions = (state: CanvasStore) => ({
  navigateToCanvas: state.navigateToCanvas,
  navigateToDepth: state.navigateToDepth,
  drillIntoNode: state.drillIntoNode,
  navigateToSiblingCanvas: state.navigateToSiblingCanvas,
  addNode: state.addNode,
  addNodeToCanvas: state.addNodeToCanvas,
  createChildCanvas: state.createChildCanvas,
  updateNode: state.updateNode,
  removeNode: state.removeNode,
  updateNodes: state.updateNodes,
  updateEdges: state.updateEdges,
  updateSelection: state.updateSelection,
  updateViewport: state.updateViewport,
  updateTransitionState: state.updateTransitionState,
});

// Selector for transition state
export const selectTransitionState = (state: CanvasStore): TransitionState => state.transitionState;

// Selector for canvas stack (all canvases)
export const selectCanvasStack = (state: CanvasStore): Record<string, CanvasLevel> =>
  state.canvasStack;

// Selector for initializeWithData action
export const selectInitializeWithData = (state: CanvasStore) => state.initializeWithData;

// ============================================================================
// State Selectors
// ============================================================================

export const selectCurrentPath = (state: CanvasStore) => state.currentPath;
export const selectCurrentPathLength = (state: CanvasStore) => state.currentPath.length;

// ============================================================================
// Action Selectors - Individual actions for granular subscriptions
// ============================================================================

// Initialization
export const selectInitializeCanvas = (state: CanvasStore) => state.initializeCanvas;

// Navigation
export const selectNavigateToCanvas = (state: CanvasStore) => state.navigateToCanvas;
export const selectNavigateToDepth = (state: CanvasStore) => state.navigateToDepth;
export const selectNavigateToSiblingCanvas = (state: CanvasStore) => state.navigateToSiblingCanvas;
export const selectDrillIntoNode = (state: CanvasStore) => state.drillIntoNode;

// Node operations
export const selectAddNode = (state: CanvasStore) => state.addNode;
export const selectAddNodeToCanvas = (state: CanvasStore) => state.addNodeToCanvas;
export const selectUpdateNode = (state: CanvasStore) => state.updateNode;
export const selectRemoveNode = (state: CanvasStore) => state.removeNode;
export const selectUpdateNodes = (state: CanvasStore) => state.updateNodes;
export const selectGetNodeById = (state: CanvasStore) => state.getNodeById;

// Edge operations
export const selectUpdateEdges = (state: CanvasStore) => state.updateEdges;
export const selectRemoveEdge = (state: CanvasStore) => state.removeEdge;

// Canvas operations
export const selectCreateChildCanvas = (state: CanvasStore) => state.createChildCanvas;
export const selectUpdateSelection = (state: CanvasStore) => state.updateSelection;
export const selectUpdateViewport = (state: CanvasStore) => state.updateViewport;
export const selectUpdateTransitionState = (state: CanvasStore) => state.updateTransitionState;
export const selectGetBreadcrumbs = (state: CanvasStore) => state.getBreadcrumbs;

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

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      canvasStack: {},
      currentPath: [],
      transitionState: {
        isTransitioning: false,
        type: 'none',
        startTime: 0,
        progress: 0,
      },

      // Actions
      initializeCanvas: () => {
        set({
          canvasStack: createDemoCanvases(),
          currentPath: ['root'],
        });

        // Set up transition callbacks to sync with store
        animatedViewportManager.setTransitionCallbacks({
          onStart: (type) => {
            set((state) => ({
              transitionState: {
                ...state.transitionState,
                isTransitioning: true,
                type,
                startTime: performance.now(),
                progress: 0,
              },
            }));
          },
          onUpdate: (transitionState) => {
            set({ transitionState });
          },
          onComplete: (_type) => {
            set((state) => ({
              transitionState: {
                ...state.transitionState,
                isTransitioning: false,
                type: 'none',
                progress: 1,
              },
            }));
          },
        });
      },

      initializeWithData: (canvases: Record<string, CanvasLevel>, initialPath?: string[]) => {
        // Determine initial path - use provided path or first canvas key
        const canvasKeys = Object.keys(canvases);
        const firstKey = canvasKeys[0];
        const path: string[] = initialPath ?? (firstKey ? [firstKey] : []);

        set({
          canvasStack: canvases,
          currentPath: path,
        });

        // Set up transition callbacks to sync with store
        animatedViewportManager.setTransitionCallbacks({
          onStart: (type) => {
            set((state) => ({
              transitionState: {
                ...state.transitionState,
                isTransitioning: true,
                type,
                startTime: performance.now(),
                progress: 0,
              },
            }));
          },
          onUpdate: (transitionState) => {
            set({ transitionState });
          },
          onComplete: (_type) => {
            set((state) => ({
              transitionState: {
                ...state.transitionState,
                isTransitioning: false,
                type: 'none',
                progress: 1,
              },
            }));
          },
        });
      },

      navigateToCanvas: async (
        targetCanvasId: string,
        sourceViewport?: Viewport,
        animated: boolean = true
      ) => {
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

        // Update state first
        set({
          canvasStack: updatedCanvasStack,
          currentPath: [...state.currentPath, targetCanvasId],
        });

        // Handle animated transition if enabled
        if (animated && targetCanvas.viewport) {
          try {
            await animatedViewportManager.animateToViewport(
              targetCanvas.viewport,
              undefined,
              'drill-in'
            );
          } catch (error) {
            console.warn('Canvas navigation animation failed:', error);
          }
        }
      },

      navigateToDepth: async (depth: number, animated: boolean = true) => {
        const state = get();

        // Ensure depth is valid
        if (depth < 0 || depth >= state.currentPath.length) return;

        const newPath = state.currentPath.slice(0, depth + 1);
        const targetCanvasId = newPath[newPath.length - 1];
        const targetCanvas = targetCanvasId ? state.canvasStack[targetCanvasId] : undefined;

        // Update path immediately
        set({
          currentPath: newPath,
        });

        // Handle animated transition if enabled
        if (animated && targetCanvas?.viewport) {
          try {
            await animatedViewportManager.animateToViewport(
              targetCanvas.viewport,
              undefined,
              'drill-out'
            );
          } catch (error) {
            console.warn('Canvas navigation animation failed:', error);
          }
        }
      },

      navigateToSiblingCanvas: async (targetCanvasId: string, animated: boolean = true) => {
        const state = get();
        const targetCanvas = state.canvasStack[targetCanvasId];

        if (!targetCanvas || state.currentPath.length === 0) {
          return;
        }

        // Replace the last item in the path with the target canvas ID (sibling navigation)
        const newPath = [...state.currentPath.slice(0, -1), targetCanvasId];

        // Update state in a single operation to avoid flicker
        set({ currentPath: newPath });

        // Handle animated transition if enabled
        if (animated && targetCanvas.viewport) {
          try {
            await animatedViewportManager.animateToViewport(
              targetCanvas.viewport,
              undefined,
              'drill-in'
            );
          } catch (error) {
            console.warn('Sibling canvas navigation animation failed:', error);
          }
        }
      },

      drillIntoNode: async (nodeId: string, animated: boolean = true) => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId) return;

        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return;

        // Find the target node
        const targetNode = currentCanvas.nodes.find((node) => node.id === nodeId);
        if (!targetNode || !targetNode.data?.isDrillable || !targetNode.data?.childCanvasId) {
          console.warn(`Node ${nodeId} is not drillable or child canvas not found`);
          return;
        }

        const childCanvasId = targetNode.data.childCanvasId as string;
        const childCanvas = state.canvasStack[childCanvasId];

        if (!childCanvas) {
          console.warn(`Child canvas ${childCanvasId} not found`);
          return;
        }

        // Save current viewport before navigation
        const currentViewport = animatedViewportManager.getCurrentViewport();
        const updatedCanvasStack = {
          ...state.canvasStack,
          [currentCanvasId]: {
            ...currentCanvas,
            viewport: currentViewport,
          },
        };

        // Update canvas state first
        set({
          canvasStack: updatedCanvasStack,
          currentPath: [...state.currentPath, childCanvasId],
        });

        if (animated) {
          try {
            // Animate drill-in: zoom to node, then restore child's viewport
            await animatedViewportManager.drillIntoNode(targetNode);
          } catch (error) {
            console.warn('Drill-in animation failed:', error);
          }
        } else {
          // Instant navigation - viewport will be restored by HierarchicalCanvas effect
          set({
            currentPath: [...state.currentPath, childCanvasId],
          });
        }
      },

      addNode: (nodeType: string, position?: { x: number; y: number }) => {
        // Deprecated: Use addNodeToCanvas with registry injection from useCanvasStoreActions
        // This method is kept for backward compatibility but should not be used directly
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId) return '';

        const currentCanvas = state.canvasStack[currentCanvasId];
        if (!currentCanvas) return '';

        // Generate unique node ID
        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Check if this is a drillable node type
        const isDrillable =
          nodeType === 'subprocess' || nodeType === 'process' || nodeType === 'loop';

        // Set default params based on node type
        const defaultParams = {
          label:
            nodeType === 'subprocess'
              ? 'Sub-Process'
              : nodeType === 'process'
                ? 'Process'
                : 'New Node',
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
            name: defaultParams.label || 'Sub-Process',
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

        const updatedNodes = currentCanvas.nodes.map((node) =>
          node.id === updatedNode.id ? updatedNode : node
        );

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

        if (!currentCanvasId || typeof currentCanvasId !== 'string') return;

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

        if (!currentCanvasId || typeof currentCanvasId !== 'string') return;
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

      updateNodes: (nodes: Node[]) => {
        const state = get();
        const currentCanvasId = state.currentPath[state.currentPath.length - 1];

        if (!currentCanvasId || typeof currentCanvasId !== 'string') return;

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

        if (!currentCanvasId || typeof currentCanvasId !== 'string') return;

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

        if (!currentCanvasId || typeof currentCanvasId !== 'string') return;

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

        if (!targetCanvasId || typeof targetCanvasId !== 'string') return;

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

      updateTransitionState: (transitionUpdate: Partial<TransitionState>) => {
        set((state) => ({
          transitionState: {
            ...state.transitionState,
            ...transitionUpdate,
          },
        }));
      },

      getNodeById: (nodeId: string, canvasId?: string) => {
        const state = get();
        const targetCanvasId = canvasId || state.currentPath[state.currentPath.length - 1];

        if (!targetCanvasId) return undefined;

        const canvas = state.canvasStack[targetCanvasId];
        if (!canvas) return undefined;

        return canvas.nodes.find((node) => node.id === nodeId);
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
