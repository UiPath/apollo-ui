import { describe, expect, it } from 'vitest';
import { edgeTargetStatusToEdgeColor } from './EdgeUtils';

describe('edgeTargetStatusToEdgeColor', () => {
  it.each([
    'Cancelled',
    'UserCancelled',
  ] as const)('maps %s to the muted stroke, not an error or info color', (status) => {
    expect(edgeTargetStatusToEdgeColor[status]).toBe('var(--canvas-icon-default)');
  });
});
