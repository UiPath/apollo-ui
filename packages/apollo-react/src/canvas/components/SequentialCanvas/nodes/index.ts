import type { NodeTypes } from '@uipath/apollo-react/canvas/xyflow/react';
import { SEQ_PLACEHOLDER_NODE_TYPE, SEQ_START_NODE_TYPE } from '../../../constants';
import { SequentialPlaceholderNode } from './SequentialPlaceholderNode';
import { SequentialStartNode } from './SequentialStartNode';

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

export { SEQ_PLACEHOLDER_NODE_TYPE, SEQ_START_NODE_TYPE };

/** nodeTypes entries for the synthetic rows. */
export const SEQUENTIAL_SYNTHETIC_NODE_TYPES: NodeTypes = {
  [SEQ_START_NODE_TYPE]: SequentialStartNode,
  [SEQ_PLACEHOLDER_NODE_TYPE]: SequentialPlaceholderNode,
};
