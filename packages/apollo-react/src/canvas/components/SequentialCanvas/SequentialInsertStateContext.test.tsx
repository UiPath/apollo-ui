import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SequentialInsertStateProvider,
  useOptionalSequentialInsertState,
} from './SequentialInsertStateContext';

describe('SequentialInsertStateProvider', () => {
  it('keeps the context value identity across provider re-renders', () => {
    // Every connector edge reads this context, so a fresh value per render would re-render all of them.
    const seen: unknown[] = [];
    function Probe() {
      seen.push(useOptionalSequentialInsertState());
      return null;
    }
    const tree = (label: string) => (
      <SequentialInsertStateProvider>
        <span>{label}</span>
        <Probe />
      </SequentialInsertStateProvider>
    );

    const view = render(tree('a'));
    view.rerender(tree('b'));

    expect(seen).toHaveLength(2);
    expect(seen[0]).toBeDefined();
    expect(seen[1]).toBe(seen[0]);
  });
});
