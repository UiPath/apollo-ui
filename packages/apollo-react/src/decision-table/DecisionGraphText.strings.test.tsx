import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type I18n, setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { renderHook } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it } from 'vitest';
import { type DecisionGraphLabels, useDecisionGraphLabels } from './useDecisionGraphStrings';

type Calls<Labels> = {
  [K in keyof Labels as Labels[K] extends string ? never : K]-?: Labels[K] extends (
    ...args: infer Args
  ) => string
    ? readonly Args[]
    : never;
};

const CALLS: Omit<Calls<DecisionGraphLabels>, 'markStatus'> = {
  ruleCount: [[1], [12]],
  seeAbove: [['Risk']],
  usedBy: [['Eligibility, Pricing']],
  showProblem: [['Error: Rules 1 and 3 overlap']],
  minimapNoMatch: [['zzz']],
  minimapResults: [[1], [3]],
  minimapDecision: [
    ['Risk', 1],
    ['Risk', 3],
  ],
  minimapReference: [['Risk']],
};

const providerFor =
  (i18n: I18n | null) =>
  ({ children }: { children: React.ReactNode }) =>
    i18n ? <I18nProvider i18n={i18n}>{children}</I18nProvider> : children;

const builtInStrings = (i18n: I18n | null): string[] => {
  const { markStatus: _, ...labels } = renderHook(() => useDecisionGraphLabels(), {
    wrapper: providerFor(i18n),
  }).result.current;
  return Object.entries(labels).flatMap(([key, value]) =>
    typeof value === 'function'
      ? ((CALLS as Record<string, readonly unknown[][]>)[key]?.map((args) =>
          (value as (...args: unknown[]) => string)(...args)
        ) ?? [])
      : [value]
  );
};

const i18nWith = (locale: string, messages: Record<string, string>) => {
  const i18n = setupI18n({ locale, messages: { [locale]: messages } });
  i18n.activate(locale);
  return i18n;
};

const english: Record<string, string> = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'locales/en.json'), 'utf8')
);
const graphIds = Object.keys(english).filter((id) => id.startsWith('decision-graph.'));

describe('DecisionGraphText strings', () => {
  it('reads every built-in string from the decision-table catalog, which keeps no id the view dropped', () => {
    const markers = Object.fromEntries(graphIds.map((id) => [id, `<${id}>`]));
    const read = builtInStrings(i18nWith('en', markers));
    expect(read.filter((text) => !/^<decision-graph\.[a-z_]+>$/.test(text))).toEqual([]);
    expect([...new Set(read)].sort()).toEqual(Object.values(markers).sort());
  });

  it('words each built-in string as the English catalog does, with a provider or none', () => {
    const fallback = builtInStrings(null);
    expect(builtInStrings(i18nWith('en', english))).toEqual(fallback);
    expect(fallback).toEqual(expect.arrayContaining(['1 rule', '12 rules', 'See Risk above']));
  });
});
