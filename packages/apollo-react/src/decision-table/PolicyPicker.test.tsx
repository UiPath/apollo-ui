import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PolicyGroup } from './PolicyPicker';
import { PolicyPicker } from './PolicyPicker';

afterEach(cleanup);

const groupsWith = (code: string): PolicyGroup[] => [
  {
    id: 'g',
    options: [{ kind: 'option', value: 'x', code, label: 'Ex', note: { kind: 'hint', text: '' } }],
  },
];

describe('PolicyPicker trigger', () => {
  it.each([
    ['only its code', 'X', 'X'],
    ['only its label for an empty code', '', 'Ex'],
  ])('shows the picked option with %s', (_, code, text) => {
    render(
      <PolicyPicker
        value="x"
        groups={groupsWith(code)}
        onChange={() => {}}
        label="P"
        dataTestId="t"
      />
    );
    expect(screen.getByTestId('t-policy').textContent).toBe(text);
  });
});
