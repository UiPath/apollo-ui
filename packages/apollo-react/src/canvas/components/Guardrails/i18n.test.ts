import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  formatGuardrailFormMessage,
  GUARDRAIL_LIST_EN_LABELS,
  GUARDRAIL_LIST_EN_MESSAGES,
  resolveGuardrailListLabels,
} from './i18n';

describe('resolveGuardrailListLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveGuardrailListLabels()).toEqual(GUARDRAIL_LIST_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveGuardrailListLabels(
      { title: 'Absicherungen', add: 'Hinzufügen' },
      { add: 'Neu' }
    );

    expect(labels.title).toBe('Absicherungen');
    expect(labels.add).toBe('Neu');
    expect(labels.empty).toBe(GUARDRAIL_LIST_EN_LABELS.empty);
  });

  it('never lets an absent string blank a default', () => {
    const labels = resolveGuardrailListLabels({ title: undefined }, { add: undefined });

    expect(labels.title).toBe('Guardrails');
    expect(labels.add).toBe('Add');
  });
});

describe('GUARDRAIL_LIST_EN_LABELS', () => {
  it('carries the template convention the row interpolates with', () => {
    expect(GUARDRAIL_LIST_EN_LABELS.reorderItem).toBe('Reorder guardrail {{name}}');
    expect(
      formatGuardrailFormMessage(GUARDRAIL_LIST_EN_LABELS.editRow, { name: 'PII detection 1' })
    ).toBe('Edit PII detection 1');
    expect(
      formatGuardrailFormMessage(GUARDRAIL_LIST_EN_LABELS.removeRow, { name: 'PII detection 1' })
    ).toBe('Remove PII detection 1');
  });
});

describe('the shared canvas catalog', () => {
  // `src/canvas` uses no lingui macros, so `lingui extract` does not feed this catalog: the
  // entries are hand-authored. This test is what `extract` would otherwise be doing, and it is
  // the only thing standing between a new list string and an untranslatable one.
  const localesDir = join(dirname(fileURLToPath(import.meta.url)), '../../locales');
  const readCatalog = (locale: string): Record<string, string> =>
    JSON.parse(readFileSync(join(localesDir, `${locale}.json`), 'utf8'));
  const catalog = readCatalog('en');
  const TRANSLATED_LOCALES = [
    'de',
    'es',
    'es-MX',
    'fr',
    'ja',
    'ko',
    'pt',
    'pt-BR',
    'ro',
    'tr',
    'zh-CN',
    'zh-TW',
  ];

  it('carries every list message with the same English', () => {
    const missing: string[] = [];
    const drifted: string[] = [];
    for (const [id, message] of Object.entries(GUARDRAIL_LIST_EN_MESSAGES)) {
      if (!(id in catalog)) missing.push(id);
      else if (catalog[id] !== message)
        drifted.push(`${id}\n    src: ${message}\n    en:  ${catalog[id]}`);
    }

    expect({ missing, drifted }).toEqual({ missing: [], drifted: [] });
  });

  it('carries no list message the source no longer declares', () => {
    // Every catalog, not just English: a renamed id otherwise leaves twelve dead translations
    // behind, and the harvest that produced them is a one-off script, not a pipeline. `ru` is
    // scanned too, although it carries no list strings by design.
    const orphans = ['en', 'ru', ...TRANSLATED_LOCALES].flatMap((locale) =>
      Object.keys(readCatalog(locale))
        .filter((id) => id.startsWith('guardrails.list.'))
        .filter((id) => !(id in GUARDRAIL_LIST_EN_MESSAGES))
        .map((id) => `${locale}: ${id}`)
    );

    expect(orphans).toEqual([]);
  });

  it('translates the two per-row action templates everywhere they were harvested', () => {
    // `remove-row` was harvested from the "Remove <thing>" aria-label both products already
    // ship (Flow `escalation_memoryArguments_removeAriaLabel`, Agents `chip.delete.aria`),
    // whose twelve translations agree; only the placeholder token was rewritten. `edit-row`
    // has no counterpart in either catalog and stays English-only, like the other four.
    const gaps = TRANSLATED_LOCALES.filter(
      (locale) => !readCatalog(locale)['guardrails.list.remove-row']
    );

    expect(gaps).toEqual([]);
    expect(catalog['guardrails.list.remove-row']).toBe('Remove {name}');
  });
});
