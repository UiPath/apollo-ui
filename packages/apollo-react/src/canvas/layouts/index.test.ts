import { describe, expect, it } from 'vitest';
import { Column, Row } from './index';

describe('Layout Components Exports', () => {
  it('exports Column component', () => {
    expect(Column).toBeDefined();
    expect(typeof Column).toBe('function');
  });

  it('exports Row component', () => {
    expect(Row).toBeDefined();
    expect(typeof Row).toBe('function');
  });
});
