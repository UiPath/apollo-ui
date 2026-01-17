import type {
  Connection,
  Edge,
  EdgeTypes,
  Node,
  NodeTypes,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { addEdge, useEdgesState, useNodesState } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo } from 'react';
import { AddNodePreview } from '../../components';
import { BaseNode } from '../../components/BaseNode/BaseNode';
import { SequenceEdge } from '../../components/Edges';
import { useNodeTypeRegistry } from '../../core';

/**
 * Options for the useCanvasStory hook.
 */
export interface UseCanvasStoryOptions {
  /**
   * Initial nodes for the canvas.
   */
  initialNodes: Node[];

  /**
   * Initial edges for the canvas.
   * @default []
   */
  initialEdges?: Edge[];

  /**
   * Custom node component to use for all node types.
   * @default BaseNode
   */
  nodeComponent?: NodeTypes[string];

  /**
   * Additional node types to merge with registry types.
   */
  additionalNodeTypes?: NodeTypes;
}

/**
 * Return type for the useCanvasStory hook.
 */
export interface UseCanvasStoryReturn {
  /** Current nodes state */
  nodes: Node[];
  /** Function to update nodes */
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  /** Handler for node changes from React Flow */
  onNodesChange: ReturnType<typeof useNodesState>[2];

  /** Current edges state */
  edges: Edge[];
  /** Edge types mapping for React Flow */
  edgeTypes: EdgeTypes;
  /** Function to update edges */
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  /** Handler for edge changes from React Flow */
  onEdgesChange: ReturnType<typeof useEdgesState>[2];

  /** Handler for new connections */
  onConnect: (connection: Connection) => void;

  /** Node type registry instance */
  nodeTypeRegistry: ReturnType<typeof useNodeTypeRegistry>;
  /** Configured node types for React Flow */
  nodeTypes: NodeTypes;

  /**
   * Bundled props for BaseCanvas component.
   * Spread these directly onto BaseCanvas for minimal boilerplate.
   */
  canvasProps: {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: ReturnType<typeof useNodesState>[2];
    onEdgesChange: ReturnType<typeof useEdgesState>[2];
    onConnect: (connection: Connection) => void;
    nodeTypes: NodeTypes;
    edgeTypes: EdgeTypes;
  };
}

/**
 * Hook that provides common canvas story setup.
 *
 * Bundles node/edge state, connection handling, and node type configuration
 * into a single hook to reduce story boilerplate.
 *
 * @example
 * ```tsx
 * const MyStory = () => {
 *   const { canvasProps } = useCanvasStory({
 *     initialNodes: [
 *       { id: '1', type: 'generic', position: { x: 0, y: 0 }, data: {} },
 *     ],
 *   });
 *
 *   return <BaseCanvas {...canvasProps} mode="design" />;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Access individual pieces when needed
 * const { nodes, setNodes, edges, nodeTypeRegistry } = useCanvasStory({
 *   initialNodes: myNodes,
 *   initialEdges: myEdges,
 * });
 * ```
 */
export function useCanvasStory(options: UseCanvasStoryOptions): UseCanvasStoryReturn {
  const { initialNodes, initialEdges, nodeComponent = BaseNode, additionalNodeTypes } = options;

  const nodeTypeRegistry = useNodeTypeRegistry();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges ?? []);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const nodeTypes = useMemo(() => {
    const types = nodeTypeRegistry.getAllNodeTypes().reduce(
      (acc, nodeType) => {
        acc[nodeType] = nodeComponent;
        return acc;
      },
      {
        preview: AddNodePreview,
        default: nodeComponent,
      } as NodeTypes
    );
    return { ...types, ...additionalNodeTypes };
  }, [nodeTypeRegistry, nodeComponent, additionalNodeTypes]);

  const edgeTypes = useMemo(() => {
    return {
      default: SequenceEdge,
    };
  }, []);

  const canvasProps = useMemo(
    () => ({
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      nodeTypes,
      edgeTypes,
      panShortcutTeachingUIMessage: '', // Disable for stories
    }),
    [nodes, edges, onNodesChange, onEdgesChange, onConnect, nodeTypes, edgeTypes]
  );

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    edgeTypes,
    setEdges,
    onEdgesChange,
    onConnect,
    nodeTypeRegistry,
    nodeTypes,
    canvasProps,
  };
}

/**
 * Hook that provides just the node types mapping from the registry.
 *
 * Use this when you only need node types without full state management.
 *
 * @example
 * ```tsx
 * const nodeTypes = useNodeTypesFromRegistry();
 * ```
 */
export function useNodeTypesFromRegistry(nodeComponent: NodeTypes[string] = BaseNode): NodeTypes {
  const nodeTypeRegistry = useNodeTypeRegistry();

  return useMemo(() => {
    return nodeTypeRegistry.getAllNodeTypes().reduce(
      (acc, nodeType) => {
        acc[nodeType] = nodeComponent;
        return acc;
      },
      { default: nodeComponent } as NodeTypes
    );
  }, [nodeTypeRegistry, nodeComponent]);
}
