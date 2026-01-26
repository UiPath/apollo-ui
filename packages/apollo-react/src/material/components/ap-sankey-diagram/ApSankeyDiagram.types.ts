import type { CSSProperties } from 'react';

/**
 * Represents a node in the Sankey diagram
 */
export interface SankeyNode {
  /** Unique identifier for the node */
  id: string;
  /** Display label for the node */
  label: string;
  /** Optional color for the node (defaults to theme color) */
  color?: string;
  /** Optional metadata for the node */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a link/flow between two nodes
 */
export interface SankeyLink {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Value/weight of the flow */
  value: number;
  /** Optional color for the link (defaults to source node color with opacity) */
  color?: string;
  /** Optional metadata for the link */
  metadata?: Record<string, unknown>;
}

/**
 * Data structure for the Sankey diagram
 */
export interface SankeyData {
  /** Array of nodes in the diagram */
  nodes: SankeyNode[];
  /** Array of links between nodes */
  links: SankeyLink[];
}

/**
 * Alignment options for nodes in the Sankey diagram
 */
export type NodeAlignment = 'left' | 'right' | 'center' | 'justify';

/**
 * Props for the ApSankeyDiagram component
 */
export interface ApSankeyDiagramProps {
  /** Data for the Sankey diagram */
  data: SankeyData;
  /** Alignment of nodes (default: 'justify') */
  nodeAlignment?: NodeAlignment;
  /** Padding between nodes (default: 16) */
  nodePadding?: number;
  /** Width of nodes (default: 24) */
  nodeWidth?: number;
  /** Custom styles for the container (can override default width and height) */
  style?: CSSProperties;
  /** Custom class name for the container */
  className?: string;
  /** Callback when a node is clicked */
  onNodeClick?: (node: SankeyNode, event: React.MouseEvent) => void;
  /** Callback when a link is clicked */
  onLinkClick?: (link: SankeyLink, event: React.MouseEvent) => void;
  /** Custom color scheme (array of colors) */
  colorScheme?: string[];
  /** Accessible label for the diagram */
  ariaLabel?: string;
}
