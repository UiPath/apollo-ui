import { describe, expect, it } from 'vitest';
import * as BaseCanvasExports from './index';

describe('BaseCanvas public exports', () => {
  it('keeps read-only enforcement helpers private when the barrel is imported', () => {
    expect(BaseCanvasExports).not.toHaveProperty('useReadOnlyBeforeDelete');
    expect(BaseCanvasExports).not.toHaveProperty('useReadOnlyEdgeIds');
  });
});
