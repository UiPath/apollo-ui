import type { EdgeProps, EdgeTypes } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { SequenceEdge } from '../Edges';
import { resolveFlowEdgeTypes } from './resolveFlowEdgeTypes';

const CustomEdge = (_props: EdgeProps) => null;

describe('resolveFlowEdgeTypes', () => {
  it('uses the same default SequenceEdge preset as the Flow canvas', () => {
    expect(resolveFlowEdgeTypes().default).toBe(SequenceEdge);
    expect(resolveFlowEdgeTypes().sequence).toBe(SequenceEdge);
  });

  it('retains the Flow default when adding a named host edge type', () => {
    const result = resolveFlowEdgeTypes({ custom: CustomEdge } as EdgeTypes);

    expect(result.default).toBe(SequenceEdge);
    expect(result.sequence).toBe(SequenceEdge);
    expect(result.custom).toBe(CustomEdge);
  });

  it('allows the host to replace the default edge renderer', () => {
    expect(resolveFlowEdgeTypes({ default: CustomEdge }).default).toBe(CustomEdge);
  });

  it('allows the host to replace the named sequence edge renderer', () => {
    expect(resolveFlowEdgeTypes({ sequence: CustomEdge }).sequence).toBe(CustomEdge);
  });
});
