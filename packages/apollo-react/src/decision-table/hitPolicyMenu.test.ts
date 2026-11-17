import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSafeLingui } from '../i18n/useSafeLingui';
import { type HitPolicyCatalog, policyHeaderOf, policyMenuOf, policyNameOf } from './hitPolicyMenu';
import type { PolicyOption } from './PolicyOptionItem';

type Policy = 'one' | 'all';
type Total = 'sum' | 'max';

const translate = () => renderHook(() => useSafeLingui()).result.current._;

const CATALOG: HitPolicyCatalog<Policy, Total> = [
  {
    label: 'Single',
    entries: [
      { kind: 'policy', policy: 'one', code: '1', label: 'One', hint: 'Only one.' },
      {
        kind: 'totals',
        policy: 'all',
        label: 'All, totalled',
        hint: 'Totals every match.',
        totals: [
          { total: 'sum', code: 'A+', label: 'Sum', hint: 'Adds.', offer: { kind: 'offered' } },
          {
            total: 'max',
            code: 'A>',
            label: 'Max',
            hint: 'Largest.',
            offer: { kind: 'refused', reason: 'Needs numbers.' },
          },
        ],
      },
    ],
  },
  {
    label: 'Many',
    entries: [{ kind: 'policy', policy: 'all', code: 'A', label: 'All', hint: 'Every match.' }],
  },
];

const outline = (options: readonly PolicyOption[]): unknown[] =>
  options.map((option) =>
    option.kind === 'submenu'
      ? { submenu: option.label, options: outline(option.options) }
      : `${option.code} ${option.label}${option.note.kind === 'disabled' ? ` (${option.note.reason})` : ''}`
  );

describe('policyMenuOf', () => {
  it("lays out the host's groups, a policy's totals in a submenu, a refused total disabled with its reason", () => {
    const menu = policyMenuOf(CATALOG, { kind: 'policy', policy: 'one' }, vi.fn(), translate());
    expect(menu.label).toBe('Hit policy: One');
    expect(menu.groups.map((group) => [group.label, outline(group.options)])).toEqual([
      [
        'Single',
        ['1 One', { submenu: 'All, totalled', options: ['A+ Sum', 'A> Max (Needs numbers.)'] }],
      ],
      ['Many', ['A All']],
    ]);
  });

  it("picks the host's typed policy or total back from the menu", () => {
    const onChange = vi.fn();
    const menu = policyMenuOf(CATALOG, { kind: 'policy', policy: 'one' }, onChange, translate());
    const [single, many] = menu.groups;
    const submenu = single?.options[1];
    const sum = submenu?.kind === 'submenu' ? submenu.options[0] : undefined;
    menu.onChange(sum?.value ?? '');
    menu.onChange(many?.options[0]?.value ?? '');
    menu.onChange('no such key');
    expect(onChange.mock.calls).toEqual([
      [{ kind: 'total', policy: 'all', total: 'sum' }],
      [{ kind: 'policy', policy: 'all' }],
    ]);
  });

  it('marks the picked total, distinct from its policy without one', () => {
    const _ = translate();
    const total = policyMenuOf(CATALOG, { kind: 'total', policy: 'all', total: 'sum' }, vi.fn(), _);
    const plain = policyMenuOf(CATALOG, { kind: 'policy', policy: 'all' }, vi.fn(), _);
    expect(total.value).not.toBe(plain.value);
    expect(plain.value).not.toBe('');
  });
});

describe('policyNameOf', () => {
  it("names a total after its policy's own label", () => {
    expect(policyNameOf(CATALOG, { kind: 'total', policy: 'all', total: 'max' }, translate())).toBe(
      'Hit policy: All · Max'
    );
  });
});

describe('policyHeaderOf', () => {
  it("words the pick from the host's catalog, and nothing for a pick it lacks", () => {
    expect(policyHeaderOf(CATALOG, { kind: 'total', policy: 'all', total: 'sum' })).toEqual({
      label: 'Sum',
      hint: 'Adds.',
    });
    expect(policyHeaderOf(CATALOG, { kind: 'total', policy: 'one', total: 'sum' })).toEqual({
      label: '',
      hint: '',
    });
  });
});
