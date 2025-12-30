import { type Edge, getIncomers, type Node } from '@uipath/uix/xyflow/react';
import { type HierarchyPointNode, stratify, tree } from 'd3-hierarchy';

// the layout direction (T = top, R = right, B = bottom, L = left, TB = top to bottom, ...)
export type LayoutDirection = 'BT' | 'LR' | 'RL' | 'TD';

export type LayoutAlgorithmOptions = {
  direction: LayoutDirection;
  spacing: [number, number];
};

export type LayoutAlgorithm = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutAlgorithmOptions
) => Promise<{ nodes: Node[]; edges: Edge[] }>;

// D3 Hierarchy doesn't support layouting in different directions, but we can
// swap the coordinates around in different ways to get the same effect.
const getPosition = (x: number, y: number, direction: LayoutDirection) => {
  switch (direction) {
    case 'TD': {
      return { x, y };
    }
    case 'LR': {
      return { x: y, y: x };
    }
    case 'BT': {
      return { x: -x, y: -y };
    }
    case 'RL': {
      return { x: -y, y: x };
    }
  }
};

type NodeWithPosition = Node & { x: number; y: number };

// Initialize the tree layout (see https://observablehq.com/@d3/tree for examples)
const layout = tree<NodeWithPosition>()
  // By default, d3 hierarchy spaces nodes that do not share a common parent quite
  // far apart. We think it looks a bit nicer (and more similar to the other layouting
  // algorithms) if we fix that distance to a uniform `1`.
  .separation(() => 1);

// D3 Hierarchy expects a single root node in a flow. Because we can't always
// guarantee that, we create a fake root node here and will make sure any real
// nodes without an incoming edge will get connected to this fake root node.
const rootNode = {
  id: 'd3-hierarchy-root',
  x: 0,
  y: 0,
  position: { x: 0, y: 0 },
  data: {},
};

const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 100;

export const d3HierarchyLayout: LayoutAlgorithm = (nodes, edges, options) =>
  Promise.resolve(
    (() => {
      const isHorizontal = options.direction === 'RL' || options.direction === 'LR';

      const initialNodes = [] as NodeWithPosition[];
      let maxNodeWidth = 0;
      let maxNodeHeight = 0;

      for (const node of nodes) {
        const nodeWithPosition = { ...node, ...node.position };

        initialNodes.push(nodeWithPosition);
        // Use default dimensions if nodes aren't measured yet
        const nodeWidth = node.measured?.width ?? DEFAULT_NODE_WIDTH;
        const nodeHeight = node.measured?.height ?? DEFAULT_NODE_HEIGHT;
        maxNodeWidth = Math.max(maxNodeWidth, nodeWidth);
        maxNodeHeight = Math.max(maxNodeHeight, nodeHeight);
      }

      // When the layout is horizontal, we swap the width and height measurements we
      // pass to the layout algorithm so things stay spaced out nicely. By adding the
      // amount of spacing to each size we can fake padding between nodes.
      const nodeSize = isHorizontal
        ? [maxNodeHeight + options.spacing[1], maxNodeWidth + options.spacing[0]]
        : [maxNodeWidth + options.spacing[0], maxNodeHeight + options.spacing[1]];
      layout.nodeSize(nodeSize as [number, number]);

      const getParentId = (node: Node) => {
        if (node.id === rootNode.id) {
          return undefined;
        }

        const incomers = getIncomers(node, nodes, edges);

        // If there are no incoming edges, we say this node is connected to the fake
        // root node to prevent having multiple root nodes in the layout. If there
        // are multiple incoming edges, only the first one will be used!
        return incomers[0]?.id || rootNode.id;
      };

      const hierarchy = stratify<NodeWithPosition>()
        .id((d) => d.id)
        .parentId(getParentId)([rootNode, ...initialNodes]);

      // We create a map of the laid out nodes here to avoid multiple traversals when
      // looking up a node's position later on.
      const root = layout(hierarchy);
      const layoutNodes = new Map<string, HierarchyPointNode<NodeWithPosition>>();
      for (const node of root) {
        if (node.id) {
          layoutNodes.set(node.id, node);
        }
      }

      const nextNodes = nodes.map((node) => {
        const layoutNode = layoutNodes.get(node.id);
        if (!layoutNode) {
          throw new Error(`Layout node not found for ${node.id}`);
        }
        const { x, y } = layoutNode;
        const position = getPosition(x, y, options.direction);
        // The layout algorithm uses the node's center point as its origin, so we need
        // to offset that position because React Flow uses the top left corner as a
        // node's origin by default.
        // Use default dimensions if nodes aren't measured yet
        const nodeWidth = node.measured?.width ?? DEFAULT_NODE_WIDTH;
        const nodeHeight = node.measured?.height ?? DEFAULT_NODE_HEIGHT;
        const offsetPosition = {
          x: position.x - nodeWidth / 2,
          y: position.y - nodeHeight / 2,
        };

        return { ...node, position: offsetPosition };
      });

      return { nodes: nextNodes, edges };
    })()
  );
