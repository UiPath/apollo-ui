import { describe, expect, it } from 'vitest';
import type { SequenceConnectorKind } from '../../../utils/sequential/sequential.types';
import { resolveConnectorStrokeStyle } from './sequentialConnectorStyle';

describe('resolveConnectorStrokeStyle', () => {
  it('renders structural flow connectors solid', () => {
    expect(resolveConnectorStrokeStyle('step')).toBe('solid');
    expect(resolveConnectorStrokeStyle('branch-entry')).toBe('solid');
    expect(resolveConnectorStrokeStyle('merge-back')).toBe('solid');
  });

  it('renders irregular references dashed', () => {
    expect(resolveConnectorStrokeStyle('goto')).toBe('dashed');
  });

  it('covers every connector kind', () => {
    const kinds: SequenceConnectorKind[] = ['step', 'branch-entry', 'merge-back', 'goto'];
    for (const kind of kinds) {
      expect(['solid', 'dashed']).toContain(resolveConnectorStrokeStyle(kind));
    }
  });
});
