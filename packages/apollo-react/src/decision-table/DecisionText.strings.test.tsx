import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type I18n, type MessageDescriptor, setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it } from 'vitest';
import { useSafeLingui } from '../i18n/useSafeLingui';
import {
  FIXTURE_COLUMN_TYPES,
  FIXTURE_HIT_POLICIES,
  policyOf,
} from './__fixtures__/hostVocabulary';
import { columnTypeChoicesOf } from './columnTypes';
import type { DecisionTextEditLabels, DecisionTextLabels } from './decisionTextTypes';
import { policyMenuOf } from './hitPolicyMenu';
import type { Translate } from './translate';
import { useDecisionTextEditLabels, useDecisionTextLabels } from './useDecisionTextStrings';
import { useTextAnnouncements } from './useTextAnnouncements';

type Calls<Labels> = {
  [K in keyof Labels as Labels[K] extends (...args: never[]) => string
    ? K
    : never]-?: Labels[K] extends (...args: infer Args) => string ? readonly Args[] : never;
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
      : typeof value === 'string'
        ? [value]
        : stringsOf(value, {})
  );

const providerFor =
  (i18n: I18n | null) =>
  ({ children }: { children: React.ReactNode }) =>
    i18n ? <I18nProvider i18n={i18n}>{children}</I18nProvider> : children;

/** Every string the view's other wordings translate, from the policy menu, column types and announcements. */
const translatedStrings = (_: Translate): string[] => {
  const read: string[] = [];
  const recorded: Translate = (descriptor: Parameters<Translate>[0] | MessageDescriptor) => {
    const text = typeof descriptor === 'string' ? _(descriptor) : _(descriptor);
    read.push(text);
    return text;
  };
  policyMenuOf(FIXTURE_HIT_POLICIES, policyOf('COLLECT'), () => undefined, recorded);
  columnTypeChoicesOf(FIXTURE_COLUMN_TYPES, recorded);
  const { result } = renderHook(() => useTextAnnouncements(recorded, 'nl'));
  act(() => result.current.announceMove(0, 2));
  return read;
};

const builtInStrings = (i18n: I18n | null) => {
  const wrapper = providerFor(i18n);
  const view = renderHook(() => useDecisionTextLabels(), { wrapper }).result.current;
  const edit = renderHook(() => useDecisionTextEditLabels(), { wrapper }).result.current;
  const { _ } = renderHook(() => useSafeLingui(), { wrapper }).result.current;
  return [...stringsOf(view, VIEW_CALLS), ...stringsOf(edit, EDIT_CALLS), ...translatedStrings(_)];
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
