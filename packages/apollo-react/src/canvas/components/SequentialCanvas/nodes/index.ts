import type { NodeTypes } from '@uipath/apollo-react/canvas/xyflow/react';
import { SEQ_PLACEHOLDER_NODE_TYPE, SEQ_START_NODE_TYPE } from '../../../constants';
import { SequentialPlaceholderNode } from './SequentialPlaceholderNode';
import { SequentialStartNode } from './SequentialStartNode';
import { SequentialStepNode } from './SequentialStepNode';

// Handle ids every bar exposes (re-exported for the connector/insert pipeline).
export {
  INVISIBLE_HANDLE_STYLE,
  SEQUENTIAL_BAR_HANDLE_IDS,
} from '../../BaseNode/BaseNodeBar';
export { SequentialInsertPreviewNode } from './SequentialInsertPreviewNode';
export {
  SequentialPlaceholderNode,
  type SequentialPlaceholderNodeData,
} from './SequentialPlaceholderNode';
export {
  SequentialStartNode,
  type SequentialStartNodeData,
} from './SequentialStartNode';
export { SequentialStepNode } from './SequentialStepNode';

/**
 * Synthetic node type keys for the start and placeholder rows. The canvas
 * the assembly stamps injected nodes with these `type` values and merges
 * these into the nodeTypes map; every real manifest type maps to
 * {@link SequentialStepNode}. Defined in constants.ts so the insert pipeline
 * (edges/sequentialInsert.ts) shares the exact same source of truth.
 */
export { SEQ_PLACEHOLDER_NODE_TYPE, SEQ_START_NODE_TYPE };

/**
 * Convenience nodeTypes entries for the synthetic rows. Spread these into the
 * per-view nodeTypes map alongside the registry types mapped to
 * {@link SequentialStepNode}.
 */
export const SEQUENTIAL_SYNTHETIC_NODE_TYPES: NodeTypes = {
  [SEQ_START_NODE_TYPE]: SequentialStartNode,
  [SEQ_PLACEHOLDER_NODE_TYPE]: SequentialPlaceholderNode,
};
