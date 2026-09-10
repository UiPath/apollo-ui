import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  GUARDRAIL_BUILDER_EN_LABELS,
  GUARDRAIL_FORM_EN_LABELS,
  GUARDRAIL_REMOVE_DIALOG_EN_LABELS,
  GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES,
  resolveGuardrailBuilderLabels,
  resolveGuardrailFormLabels,
  resolveGuardrailRemoveDialogLabels,
} from './i18n';

describe('resolveGuardrailRemoveDialogLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveGuardrailRemoveDialogLabels()).toEqual(GUARDRAIL_REMOVE_DIALOG_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveGuardrailRemoveDialogLabels(
      { title: 'Leitplanke entfernen', remove: 'Entfernen' },
      { remove: 'Löschen' }
    );

    expect(labels.title).toBe('Leitplanke entfernen');
    expect(labels.remove).toBe('Löschen');
    expect(labels.cancel).toBe(GUARDRAIL_REMOVE_DIALOG_EN_LABELS.cancel);
  });

  it('never lets an absent string blank a default', () => {
    const labels = resolveGuardrailRemoveDialogLabels(
      { title: undefined },
      { stillApplicable: undefined }
    );

    expect(labels.title).toBe('Remove guardrail');
    expect(labels.stillApplicable).toBe('It will still be applicable to:');
  });

  it('keeps the English templates in the `{{token}}` convention the component formats', () => {
    expect(GUARDRAIL_REMOVE_DIALOG_EN_LABELS.confirmPrompt).toContain('{{name}}');
    expect(GUARDRAIL_REMOVE_DIALOG_EN_LABELS.removedForTool).toContain('{{toolName}}');
    // The catalogs store the ICU source instead, which is what translators receive.
    expect(
      GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES['guardrails.remove-dialog.confirm-prompt']
    ).toContain('{name}');
  });
});

describe('the other label sets still layer the same way', () => {
  // All four resolvers share one `mergeLabels`, so one case per set is enough to catch a
  // wiring mistake in the shared helper.
  it('merges builder labels', () => {
    const labels = resolveGuardrailBuilderLabels({ save: 'Speichern' }, { cancel: undefined });

    expect(labels.save).toBe('Speichern');
    expect(labels.cancel).toBe(GUARDRAIL_BUILDER_EN_LABELS.cancel);
  });

  it('merges validator form labels', () => {
    const labels = resolveGuardrailFormLabels({ addItem: 'Hinzufügen' }, { addItem: 'Add row' });

    expect(labels.addItem).toBe('Add row');
    expect(labels.enumPlaceholder).toBe(GUARDRAIL_FORM_EN_LABELS.enumPlaceholder);
  });
});

describe('the shared canvas catalog', () => {
  // `src/canvas` uses no lingui macros, so `lingui extract` does not feed this catalog: the
  // entries are hand-authored. This test is what `extract` would otherwise be doing, and it is
  // the only thing standing between a new dialog string and an untranslatable one.
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

  it('carries every remove-dialog message with the same English', () => {
    const missing: string[] = [];
    const drifted: string[] = [];
    for (const [id, message] of Object.entries(GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES)) {
      if (!(id in catalog)) missing.push(id);
      else if (catalog[id] !== message)
        drifted.push(`${id}\n    src: ${message}\n    en:  ${catalog[id]}`);
    }

    expect({ missing, drifted }).toEqual({ missing: [], drifted: [] });
  });

  it('carries no remove-dialog message the source no longer declares', () => {
    // Every locale, not just English: a renamed id otherwise leaves twelve dead translations
    // behind, and the harvest that produced them is a one-off script, not a pipeline.
    const orphans = ['en', ...TRANSLATED_LOCALES].flatMap((locale) =>
      Object.keys(readCatalog(locale))
        .filter((id) => id.startsWith('guardrails.remove-dialog.'))
        .filter((id) => !(id in GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES))
        .map((id) => `${locale}: ${id}`)
    );

    expect(orphans).toEqual([]);
  });

  it('translates every remove-dialog message in all twelve translated locales', () => {
    // The seven strings were harvested 1:1 from the two products' own catalogs, which carry
    // the same English for all seven, so full coverage is the shipped state; `ru` is
    // deliberately absent (both products ship it empty, and apollo-react's `ru` falls back to
    // English by convention).
    const gaps = TRANSLATED_LOCALES.flatMap((locale) => {
      const messages = readCatalog(locale);
      return Object.keys(GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES)
        .filter((id) => !messages[id])
        .map((id) => `${locale}: ${id}`);
    });

    expect(gaps).toEqual([]);
  });
});
