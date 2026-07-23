// Local barrel for the sequential connector + insert pipeline. This is NOT
// re-exported from components/index.ts; the feature stays out of the public
// canvas barrel until GA (D13). Types first, component/helpers after.

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
