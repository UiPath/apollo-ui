import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PolicyGroup } from './PolicyPicker';
import { PolicyPicker } from './PolicyPicker';
import { BAND_COLUMN_BUTTON_CLASS } from './sentenceStyles';

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
  it("takes the column chips' size and focus ring", () => {
    render(
      <PolicyPicker
        value="x"
        groups={groupsWith('F')}
        onChange={() => {}}
        label="P"
        dataTestId="t"
      />
    );
    const chip = [
      'h-6',
      'rounded-md',
      'px-2',
      'text-xs',
      'focus-visible:ring-1',
      'focus-visible:ring-primary',
    ];
    expect(BAND_COLUMN_BUTTON_CLASS.split(' ')).toEqual(expect.arrayContaining(chip));
    expect(screen.getByTestId('t-policy').className.split(' ')).toEqual(
      expect.arrayContaining(chip)
    );
  });
});
