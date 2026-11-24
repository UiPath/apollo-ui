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

describe('PolicyPicker trigger chip', () => {
  it('is sized and focused as the column chips', () => {
    render(
      <PolicyPicker
        groups={groupsWith('F')}
        value="x"
        onChange={() => {}}
        label="Hit policy"
        dataTestId="t"
      />
    );
    const trigger = screen.getByTestId('t-policy');
    const tokens = trigger.className.split(' ');
    for (const token of ['h-6', 'text-xs', 'rounded-md', 'px-2', 'focus-visible:ring-1']) {
      expect(tokens).toContain(token);
    }
  });
});
