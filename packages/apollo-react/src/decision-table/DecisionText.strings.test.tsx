import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type I18n, setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, renderHook, screen, within } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  GRID_SENTENCE_COLUMNS,
  GRID_SENTENCE_HEADER,
  GRID_SENTENCE_RULES,
} from './__fixtures__/sentences.fixtures';
import { DecisionText, type DecisionTextProps } from './DecisionText';
import type {
  DecisionTextEdit,
  DecisionTextEditLabels,
  DecisionTextLabels,
} from './decisionTextTypes';
import {
  useDecisionTextEditLabels,
  useDecisionTextLabels,
  withLabelOverrides,
} from './useDecisionTextStrings';

type Calls<Labels> = {
  [K in keyof Labels as Labels[K] extends string ? never : K]-?: Labels[K] extends (
    ...args: infer Args
  ) => string
    ? readonly Args[]
    : never;
};

const VIEW_CALLS: Calls<DecisionTextLabels> = {
  markStatus: [
    ['error', 'Rules 2 and 3 overlap'],
    ['error', undefined],
    ['warning', undefined],
  ],
  moreValues: [[9980]],
  conditionVerdict: [[true], [false]],
  cell: [
    ['age', '25 and 60', 2],
    ['income', '', 1],
  ],
  openDecision: [['income']],
  changeStatus: [['add'], ['update'], ['delete']],
  movedFrom: [[2]],
  unchangedRules: [[1], [12]],
  showRules: [[4, 15]],
};

const EDIT_CALLS: Calls<DecisionTextEditLabels> = {
  addCondition: [[2]],
  removeCondition: [['age', 2]],
  clearOutcome: [['risk', 2]],
  ruleActions: [[2]],
  deleteRule: [[2]],
  newCondition: [['income', 3]],
  inputColumn: [['Score']],
  outputColumn: [['Risk']],
};

/** Every string a label table gives, each function called with its samples. */
const stringsOf = (labels: object, calls: object): string[] =>
  Object.entries(labels).flatMap(([key, value]) =>
    typeof value === 'function'
      ? ((calls as Record<string, readonly unknown[][]>)[key]?.map((args) => value(...args)) ?? [])
      : [value]
  );

const providerFor =
  (i18n: I18n | null) =>
  ({ children }: { children: React.ReactNode }) =>
    i18n ? <I18nProvider i18n={i18n}>{children}</I18nProvider> : children;

const builtInStrings = (i18n: I18n | null) => {
  const wrapper = providerFor(i18n);
  const view = renderHook(() => useDecisionTextLabels(undefined), { wrapper }).result.current;
  const edit = renderHook(() => useDecisionTextEditLabels(undefined), { wrapper }).result.current;
  return [...stringsOf(view, VIEW_CALLS), ...stringsOf(edit, EDIT_CALLS)];
};

const i18nWith = (locale: string, messages: Record<string, string>) => {
  const i18n = setupI18n({ locale, messages: { [locale]: messages } });
  i18n.activate(locale);
  return i18n;
};

const english: Record<string, string> = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'locales/en.json'), 'utf8')
);

const decisionTextIds = Object.keys(english).filter((id) => id.startsWith('decision-text.'));

describe('DecisionText strings', () => {
  it('reads every built-in string from the decision-table catalog, which keeps no id the view dropped', () => {
    const markers = Object.fromEntries(decisionTextIds.map((id) => [id, `<${id}>`]));
    const read = builtInStrings(i18nWith('en', markers));
    expect(read.filter((text) => !/^<decision-text\.[a-z_]+>$/.test(text))).toEqual([]);
    expect([...new Set(read)].sort()).toEqual(Object.values(markers).sort());
  });

  it("words each built-in string as the English catalog does, the host's locale or none", () => {
    const fallback = builtInStrings(null);
    expect(builtInStrings(i18nWith('en', english))).toEqual(fallback);
    expect(fallback).toContain('Error: Rules 2 and 3 overlap');
    expect(fallback).toContain('+9,980 more');
    expect(fallback).toContain('income, rule 1');
  });

  it("takes the active locale's translation and the English for one it lacks", () => {
    const wrapper = providerFor(i18nWith('de', { 'decision-text.band_inputs': 'Eingaben' }));
    const { result } = renderHook(() => useDecisionTextLabels(undefined), { wrapper });
    expect([result.current.inputs, result.current.outputs]).toEqual(['Eingaben', 'Outputs']);
  });

  it('puts each defined override over its default and keeps the default for one left undefined', () => {
    const defaults = { apply: 'Apply', cancel: 'Cancel', clear: 'Clear' };
    expect(withLabelOverrides(defaults, { apply: 'Übernehmen', cancel: undefined })).toEqual({
      apply: 'Übernehmen',
      cancel: 'Cancel',
      clear: 'Clear',
    });
    expect(withLabelOverrides(defaults, undefined)).toBe(defaults);
  });

  it("renders a host's partial strings, functions among them, over the view's own", () => {
    const edit: DecisionTextEdit = {
      onCommit: vi.fn(),
      onClearCell: vi.fn(),
      onDeleteRule: vi.fn(),
      labels: { deleteRule: (position) => `Regel ${position} löschen`, addCondition: undefined },
    };
    const props: DecisionTextProps = {
      rules: GRID_SENTENCE_RULES,
      ...GRID_SENTENCE_COLUMNS,
      header: GRID_SENTENCE_HEADER,
      labels: { inputs: 'Eingaben' },
      ariaLabel: 'Rules',
      dataTestId: 'nl',
      selected: { rowId: 'r2' },
      onSelect: vi.fn(),
      edit,
    };
    render(<DecisionText {...props} />);
    const bands = screen.getByTestId('nl-bands');
    expect(within(bands).getByText('Eingaben')).toBeInTheDocument();
    expect(within(bands).getByText('Outputs')).toBeInTheDocument();
    const card = screen.getByTestId('nl-row-r2');
    expect(within(card).getByRole('button', { name: 'Regel 2 löschen' })).toBeInTheDocument();
    expect(
      within(card).getByRole('button', { name: 'Add condition to rule 2' })
    ).toBeInTheDocument();
  });
});
