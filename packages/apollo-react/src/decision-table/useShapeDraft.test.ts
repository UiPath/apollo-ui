import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useShapeDraft } from './useShapeDraft';
import type { HeldValues, ValueFieldData } from './valueTypes';

const condition = (held: HeldValues<number>): ValueFieldData<number> => ({
  kind: 'condition',
  allowedValues: [],
  expression: '',
  operators: [{ operator: held.operator, label: 'is', shape: held.shape }],
  held,
});

const draftOf = (held: HeldValues<number>, token: string, adds = false) =>
  renderHook(() => useShapeDraft(condition(held), token, adds)).result.current;

describe('useShapeDraft', () => {
  it.each([
    ['a new condition whose token is empty', 'true', '', true],
    ['a held literal its token words differently', '1000', '1,000', false],
  ])('opens a single value from the held value for %s', (_, value, token, adds) => {
    const draft = draftOf({ shape: 'single', operator: 0, value }, token, adds);
    expect(draft.text).toBe(value);
    expect(draft.current).toEqual({ kind: 'single', operator: 0, value });
    expect(draft.problem).toBeNull();
  });

  it('opens a valueless condition with no values', () => {
    const draft = draftOf({ shape: 'valueless', operator: 0 }, 'is empty');
    expect(draft.values).toEqual([]);
  });
});
