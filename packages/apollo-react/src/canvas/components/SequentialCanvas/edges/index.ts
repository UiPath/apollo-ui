// Local barrel for the sequential connector + insert pipeline. Deliberately NOT
// re-exported by ../index.ts, so none of it reaches the public canvas surface: the
// connector edge and the insert plumbing are internals of SequentialCanvas, not a
// supported API. (This is a narrower claim than the superseded D13, which withheld
// the whole feature from the barrel; the component itself IS public now. See
// ../../index.ts.) Types first, component/helpers after.

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
