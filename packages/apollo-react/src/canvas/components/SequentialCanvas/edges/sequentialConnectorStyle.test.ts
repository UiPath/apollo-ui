import { describe, expect, it } from 'vitest';
import type { SequenceConnectorKind } from '../../../utils/sequential/sequential.types';
import { resolveConnectorStrokeStyle } from './sequentialConnectorStyle';

describe('resolveConnectorStrokeStyle', () => {
  it('renders structural spine connectors solid', () => {
    expect(resolveConnectorStrokeStyle('step')).toBe('solid');
    expect(resolveConnectorStrokeStyle('branch-entry')).toBe('solid');
  });

  it('renders rejoin / reference connectors dashed', () => {
    expect(resolveConnectorStrokeStyle('merge-back')).toBe('dashed');
    expect(resolveConnectorStrokeStyle('goto')).toBe('dashed');
  });

  it('renders a straight structural-container continuation solid', () => {
    expect(resolveConnectorStrokeStyle('merge-back', { straightContainerContinuation: true })).toBe(
      'solid'
    );
  });

  it('covers every connector kind', () => {
    const kinds: SequenceConnectorKind[] = ['step', 'branch-entry', 'merge-back', 'goto'];
    for (const kind of kinds) {
      expect(['solid', 'dashed']).toContain(resolveConnectorStrokeStyle(kind));
    }
  });
});
