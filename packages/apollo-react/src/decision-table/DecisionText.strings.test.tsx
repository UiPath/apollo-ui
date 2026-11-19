import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type I18n, setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { renderHook } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it } from 'vitest';
import type { DecisionTextEditLabels, DecisionTextLabels } from './decisionTextTypes';
import { useDecisionTextEditLabels, useDecisionTextLabels } from './useDecisionTextStrings';

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
  openCitation: [[3]],
  citationPage: [[3]],
  changeStatus: [['add'], ['update'], ['delete']],
  movedFrom: [[2]],
  unchangedRules: [[1], [12]],
  showRules: [[4, 15]],
  policyName: [['Collect · Sum']],
  ruleMoved: [[1, 3]],
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
  allowedValuesExample: [['1, 2']],
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
  const view = renderHook(() => useDecisionTextLabels(), { wrapper }).result.current;
  const edit = renderHook(() => useDecisionTextEditLabels(), { wrapper }).result.current;
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
    const { result } = renderHook(() => useDecisionTextLabels(), { wrapper });
    expect([result.current.inputs, result.current.outputs]).toEqual(['Eingaben', 'Outputs']);
  });
});
