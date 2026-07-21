import type { EdgeTypes } from '@uipath/apollo-react/canvas/xyflow/react';
import { SequenceEdge } from '../Edges';

const DEFAULT_FLOW_EDGE_TYPES: EdgeTypes = {
  default: SequenceEdge,
  sequence: SequenceEdge,
};

/** Matches the standard Flow canvas edge preset while allowing host overrides. */
export function resolveFlowEdgeTypes(overrides?: EdgeTypes): EdgeTypes {
  return overrides ? { ...DEFAULT_FLOW_EDGE_TYPES, ...overrides } : DEFAULT_FLOW_EDGE_TYPES;
}
