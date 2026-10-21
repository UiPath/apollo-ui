import { describe, expect, it } from 'vitest';
import { isAddableSection } from './NodeVariablesPanel.types';

describe('isAddableSection', () => {
  it('accepts the sections with a header +', () => {
    for (const section of ['outputs', 'variables', 'assets']) {
      expect(isAddableSection(section)).toBe(true);
    }
  });

  it('rejects per-row sections, unknown values, and Object.prototype members', () => {
    for (const value of [
      'inputs',
      'nodes',
      '',
      'Outputs',
      'constructor',
      'toString',
      '__proto__',
    ]) {
      expect(isAddableSection(value)).toBe(false);
    }
  });
});
