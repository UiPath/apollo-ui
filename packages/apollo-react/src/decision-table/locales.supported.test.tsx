import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfig } from '@lingui/conf';
import { type Messages, setupI18n } from '@lingui/core';
import { compileMessage } from '@lingui/message-utils/compileMessage';
import { I18nProvider } from '@lingui/react';
import { renderHook } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it } from 'vitest';
import { useDecisionGraphLabels } from './useDecisionGraphStrings';
import { useDecisionTextEditLabels, useDecisionTextLabels } from './useDecisionTextStrings';
import { useGridStrings } from './useGridStrings';

const folder = dirname(fileURLToPath(import.meta.url));
const { locales } = getConfig({ configPath: join(folder, '..', '..', 'lingui.config.ts') });

const english: Record<string, string> = JSON.parse(
  readFileSync(join(folder, 'locales', 'en.json'), 'utf8')
);

const sampleValues = Object.fromEntries(
  Object.values(english)
    .flatMap((message) => [...message.matchAll(/\{(\w+)/g)].map(([, name]) => name))
    .map((name) => [name, 3])
);

const holdsMessages = (module: unknown): module is { messages: Messages } =>
  typeof module === 'object' &&
  module !== null &&
  'messages' in module &&
  typeof module.messages === 'object' &&
  module.messages !== null;

const compiledCatalog = async (locale: string): Promise<Messages> => {
  const module: unknown = await import(join(folder, 'locales', `${locale}.ts`));
  if (!holdsMessages(module)) throw new Error(`No compiled decision-table catalog for ${locale}`);
  return module.messages;
};

const compiledI18n = async (locale: string) => {
  const i18n = setupI18n({ locale, messages: { [locale]: await compiledCatalog(locale) } });
  i18n.activate(locale);
  return i18n;
};

type Wrapper = ({ children }: { children: React.ReactNode }) => React.JSX.Element;

const inLocale = async (locale: string): Promise<Wrapper> => {
  const i18n = await compiledI18n(locale);
  return ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};

const withCatalog = (locale: string, messages: Record<string, string>): Wrapper => {
  const compiled: Messages = Object.fromEntries(
    Object.entries(messages).map(([id, message]) => [id, compileMessage(message)])
  );
  const i18n = setupI18n({ locale, messages: { [locale]: compiled } });
  i18n.activate(locale);
  return ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};

const sampleStrings = (wrapper: Wrapper): string[] => {
  const view = renderHook(() => useDecisionTextLabels(), { wrapper }).result.current;
  const edit = renderHook(() => useDecisionTextEditLabels(), { wrapper }).result.current;
  const graph = renderHook(() => useDecisionGraphLabels(), { wrapper }).result.current;
  const grid = renderHook(() => useGridStrings(), { wrapper }).result.current;
  return [
    view.inputs,
    view.moreValues(9980),
    view.unchangedRules(12),
    view.openDecision('income'),
    edit.addCondition(2),
    graph.ruleCount(3),
    graph.minimapDecision('Risk', 1),
    grid.dragRow,
  ];
};

describe('decision-table catalog in every configured locale', () => {
  it.each(locales)('%s compiles every English id to readable text', async (locale) => {
    const catalog = await compiledCatalog(locale);
    expect(Object.keys(catalog)).toEqual(expect.arrayContaining(Object.keys(english)));
    const i18n = await compiledI18n(locale);
    const unreadable = Object.keys(english).filter((id) => {
      const text = i18n.t(id, sampleValues);
      return text === id || /[{}]/.test(text) || text.trim() === '';
    });
    expect(unreadable).toEqual([]);
  });

  it.each(locales)('%s renders the views’ strings without ids or ICU syntax', async (locale) => {
    const strings = sampleStrings(await inLocale(locale));
    expect(strings.filter((text) => /decision-(text|graph|table)\.|[{}]|^\s*$/.test(text))).toEqual(
      []
    );
  });

  it('formats a plural count with the active locale’s digits', () => {
    const wrapper = withCatalog('de', {
      'decision-text.more_values': '{count, plural, other {+# MORE}}',
    });
    const view = renderHook(() => useDecisionTextLabels(), { wrapper }).result.current;
    expect(view.moreValues(9980)).toBe('+9.980 MORE');
  });

  it('chooses a translation’s plural form by the locale’s plural rules', () => {
    const forms = '{count, plural, one {ONE #} few {FEW #} many {MANY #} other {OTHER #}}';
    const wrapper = withCatalog('ru', {
      'decision-graph.rule_count': forms,
      'decision-text.unchanged_rules': forms,
    });
    const graph = renderHook(() => useDecisionGraphLabels(), { wrapper }).result.current;
    const view = renderHook(() => useDecisionTextLabels(), { wrapper }).result.current;
    expect([1, 2, 5, 21].map(graph.ruleCount)).toEqual(['ONE 1', 'FEW 2', 'MANY 5', 'ONE 21']);
    expect([1, 3, 11].map(view.unchangedRules)).toEqual(['ONE 1', 'FEW 3', 'MANY 11']);
  });

  it('uses the other form in a locale whose rules have no one', () => {
    const wrapper = withCatalog('ja', {
      'decision-graph.rule_count': '{count, plural, one {ONE #} other {OTHER #}}',
    });
    const graph = renderHook(() => useDecisionGraphLabels(), { wrapper }).result.current;
    expect([1, 2].map(graph.ruleCount)).toEqual(['OTHER 1', 'OTHER 2']);
  });
});
