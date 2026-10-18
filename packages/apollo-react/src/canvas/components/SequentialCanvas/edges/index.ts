// Internal barrel, deliberately not re-exported by ../index.ts: the connector edge
// and insert plumbing are SequentialCanvas internals, not a supported API.

export { SequentialBranchHeader } from './SequentialBranchHeader';
export { SequentialConnectorEdge } from './SequentialConnectorEdge';
export type {
  SequentialConnectorData,
  SequentialConnectorEdgeProps,
  SequentialConnectorEdgeType,
} from './SequentialConnectorEdge.types';
export type { SequentialInsertButtonProps } from './SequentialInsertButton';
export { SequentialInsertButton } from './SequentialInsertButton';
export { resolveConnectorStrokeStyle } from './sequentialConnectorStyle';
export type { SequentialInsertArgs } from './sequentialInsert';
export {
  buildSequentialPreviewOptions,
  getSequentialIgnoredNodeTypes,
  SEQ_INSERTED_FLAG,
  SEQUENTIAL_IGNORED_NODE_TYPES,
  sequentialOnBeforeNodeAdded,
} from './sequentialInsert';
export type { UseSequentialInsertResult } from './useSequentialInsert';
export { useSequentialInsert } from './useSequentialInsert';
