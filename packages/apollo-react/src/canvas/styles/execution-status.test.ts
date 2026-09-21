import { describe, expect, it } from 'vitest';
import { getExecutionStatusBorder } from './execution-status';

describe('getExecutionStatusBorder cancel treatment', () => {
  it.each(['Cancelled', 'UserCancelled'])('gives %s a muted pulsing border', (status) => {
    const { styles } = getExecutionStatusBorder(status);

    expect(styles).toContain('border-color: var(--canvas-icon-default)');
    expect(styles).toContain('animation:');
    expect(styles).not.toContain('--canvas-error');
  });
});
