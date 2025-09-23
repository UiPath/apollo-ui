import type { Node, Edge, Viewport } from "@uipath/uix/xyflow/react";

export interface CanvasLevel<
  N extends Record<string, unknown> = Record<string, unknown>,
  E extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  name: string;
  nodes: Node<N>[];
  edges: Edge<E>[];
  nodeTypes: string[]; // list of node types, to be pulled from a central registry
  edgeTypes: string[]; // list of edge types, to be pulled from a central registry
  viewport: Viewport;
  selection: {
    isSingleNodeSelected: boolean;
    isSingleEdgeSelected: boolean;
    nodeIds: string[];
    edgeIds: string[];
  };
  options: Record<string, unknown>; // canvas specific options (snapToGrid, etc.)
  properties: Record<string, unknown>; // consumer specific properties
}
