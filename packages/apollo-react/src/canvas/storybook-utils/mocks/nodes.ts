import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { BaseNodeData, NodeShape } from '../../components/BaseNode/BaseNode.types';
import { HandleGroupManifest } from '../../schema/node-definition';

/**
 * Common node positions for grid layouts.
 */
export const NodePositions = {
  /** First row, first column */
  row1col1: { x: 96, y: 96 },
  /** First row, second column */
  row1col2: { x: 288, y: 96 },
  /** First row, third column */
  row1col3: { x: 480, y: 96 },
  /** Second row, first column */
  row2col1: { x: 96, y: 255 },
  /** Second row, second column */
  row2col2: { x: 288, y: 255 },
  /** Second row, third column */
  row2col3: { x: 480, y: 255 },
  /** Third row, first column */
  row3col1: { x: 96, y: 414 },
  /** Third row, second column */
  row3col2: { x: 288, y: 414 },
  /** Third row, third column */
  row3col3: { x: 480, y: 414 },
} as const;

/**
 * Options for creating a node.
 */
export interface CreateNodeOptions<T = Record<string, unknown>> {
  /** Unique node ID */
  id: string;
  /** Node type (should match a manifest registration) */
  type?: string;
  /** Node position */
  position?: { x: number; y: number };
  /** Node data (merged with defaults) */
  data?: Partial<BaseNodeData & T>;
  /** Display configuration (overrides manifest defaults) */
  display?: {
    label?: string;
    subLabel?: string;
    shape?: NodeShape;
    color?: string;
    background?: string;
    /** Icon name (Lucide kebab-case format, e.g., "cloud-upload", "settings") */
    icon?: string;
    iconColor?: string;
    iconBackground?: string;
  };
  /** Handle configurations (overrides manifest handles) */
  handleConfigurations?: HandleGroupManifest[];
  /** Whether node is selected */
  selected?: boolean;
  /** Enable SmartHandle for dynamic handle positioning */
  useSmartHandles?: boolean;
  /** Execution status for the node */
  executionStatus?:
    | 'NotExecuted'
    | 'InProgress'
    | 'Completed'
    | 'Failed'
    | 'Paused'
    | 'Cancelled'
    | 'UserCancelled'
    | 'Terminated';
}

/**
 * Creates a generic node with common defaults.
 * Now compatible with manifest-based node system.
 *
 * @example
 * ```tsx
 * const node = createNode({
 *   id: 'my-node',
 *   type: 'uipath.decision',
 *   position: NodePositions.row1col1,
 *   data: {
 *     nodeType: 'uipath.decision',
 *     version: '1.0.0',
 *     parameters: { condition: 'value > 10' },
 *   },
 *   display: { label: 'Check Value', shape: 'square' },
 *   executionStatus: 'Completed',
 * });
 * ```
 */
export function createNode<T = Record<string, unknown>>(
  options: CreateNodeOptions<T>
): Node<BaseNodeData & T> {
  const {
    id,
    type = 'generic',
    position = { x: 0, y: 0 },
    data = {},
    display,
    handleConfigurations,
    selected = false,
    useSmartHandles,
    executionStatus,
  } = options;

  // Build base data with required fields for manifest system
  const baseData: Partial<BaseNodeData> = {
    nodeType: type,
    version: (data as any).version || '1.0.0',
    parameters: (data as any).parameters || {},
    display: display || (data as any).display,
    handleConfigurations: handleConfigurations || (data as any).handleConfigurations,
    useSmartHandles: useSmartHandles ?? (data as any).useSmartHandles,
    executionStatus: executionStatus || (data as any).executionStatus,
  };

  return {
    id,
    type,
    position,
    selected,
    data: {
      ...baseData,
      ...data,
    } as unknown as BaseNodeData & T,
  };
}

/**
 * Creates a grid of nodes for testing different states.
 *
 * @example
 * ```tsx
 * const nodes = createNodeGrid({
 *   baseId: 'test',
 *   type: 'uipath.decision',
 *   rows: [
 *     [{ label: 'A' }, { label: 'B' }],
 *     [{ label: 'C' }, { label: 'D' }],
 *   ],
 * });
 * ```
 */
export function createNodeGrid(options: {
  /** Base ID prefix for nodes */
  baseId: string;
  /** Node type for all nodes (should match a manifest) */
  type?: string;
  /** 2D array of node configurations */
  rows: Array<
    Array<{ label: string; subLabel?: string; shape?: NodeShape; executionStatus?: string }>
  >;
  /** Starting X position */
  startX?: number;
  /** Starting Y position */
  startY?: number;
  /** Horizontal gap between nodes */
  gapX?: number;
  /** Vertical gap between rows */
  gapY?: number;
}): Node<BaseNodeData>[] {
  const {
    baseId,
    type = 'generic',
    rows,
    startX = 96,
    startY = 96,
    gapX = 192,
    gapY = 159,
  } = options;

  const nodes: Node<BaseNodeData>[] = [];

  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      nodes.push(
        createNode({
          id: `${baseId}-${rowIndex}-${colIndex}`,
          type,
          position: {
            x: startX + colIndex * gapX,
            y: startY + rowIndex * gapY,
          },
          data: {
            nodeType: type,
            version: '1.0.0',
            parameters: {},
          },
          display: {
            label: cell.label,
            subLabel: cell.subLabel,
            shape: cell.shape ?? 'square',
          },
          executionStatus: cell.executionStatus as any,
        })
      );
    });
  });

  return nodes;
}

/**
 * Common handle configurations for stories.
 */
export const HandleConfigs = {
  /** Single output handle on the right */
  rightOutput: [
    {
      position: Position.Right,
      handles: [
        { id: 'output', type: 'source' as const, handleType: 'output' as const, label: 'Output' },
      ],
    },
  ],

  /** Single input handle on the left */
  leftInput: [
    {
      position: Position.Left,
      handles: [
        { id: 'input', type: 'target' as const, handleType: 'input' as const, label: 'Input' },
      ],
    },
  ],

  /** Input and output handles (left/right) */
  inputOutput: [
    {
      position: Position.Left,
      handles: [
        { id: 'input', type: 'target' as const, handleType: 'input' as const, label: 'Input' },
      ],
    },
    {
      position: Position.Right,
      handles: [
        { id: 'output', type: 'source' as const, handleType: 'output' as const, label: 'Output' },
      ],
    },
  ],

  /** Multiple bottom handles for artifacts */
  bottomArtifacts: (labels: string[]) => [
    {
      position: Position.Bottom,
      handles: labels.map((label, i) => ({
        id: `artifact-${i}`,
        type: 'source' as const,
        handleType: 'artifact' as const,
        label,
      })),
    },
  ],
} as const;

/**
 * Creates execution status variations of a node for testing status display.
 *
 * @example
 * ```tsx
 * const variations = createStatusVariations({
 *   type: 'uipath.decision',
 *   position: { x: 96, y: 96 },
 *   data: {
 *     nodeType: 'uipath.decision',
 *     version: '1.0.0',
 *     parameters: {},
 *   },
 *   display: { label: 'Decision', shape: 'square' },
 * });
 * ```
 */
export function createStatusVariations(
  baseConfig: Omit<CreateNodeOptions, 'id' | 'executionStatus'>
): Node<BaseNodeData>[] {
  const statuses: Array<'NotExecuted' | 'InProgress' | 'Completed' | 'Failed' | 'Paused'> = [
    'NotExecuted',
    'InProgress',
    'Completed',
    'Failed',
    'Paused',
  ];

  return statuses.map((status, index) =>
    createNode({
      ...baseConfig,
      id: `node-${status}`,
      position: {
        x: (baseConfig.position?.x ?? 96) + index * 192,
        y: baseConfig.position?.y ?? 96,
      },
      data: {
        nodeType: baseConfig.type || 'generic',
        version: '1.0.0',
        parameters: {},
        ...baseConfig.data,
      },
      display: {
        ...baseConfig.display,
        subLabel: status,
      },
      executionStatus: status,
    })
  );
}
