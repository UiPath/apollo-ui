import { describe, expect, it } from 'vitest';
import {
  formatGuardrailFormMessage,
  GUARDRAIL_FORM_EN_LABELS,
  resolveGuardrailFormLabels,
} from './i18n';
import {
  GUARDRAIL_FORM_LOCALES,
  loadGuardrailMessages,
  resolveGuardrailFormLocale,
} from './load-messages';

describe('resolveGuardrailFormLocale', () => {
  it('resolves exact tags case-insensitively', () => {
    expect(resolveGuardrailFormLocale('ja')).toBe('ja');
    expect(resolveGuardrailFormLocale('PT-br')).toBe('pt-BR');
  });

  it('normalizes underscore separators', () => {
    expect(resolveGuardrailFormLocale('pt_BR')).toBe('pt-BR');
  });

  it('falls back to the base language for unsupported regional tags', () => {
    expect(resolveGuardrailFormLocale('fr-CA')).toBe('fr');
  });

  it('resolves Chinese script and region subtags to the right catalog', () => {
    expect(resolveGuardrailFormLocale('zh-Hant-TW')).toBe('zh-TW');
    expect(resolveGuardrailFormLocale('zh-Hant')).toBe('zh-TW');
    expect(resolveGuardrailFormLocale('zh-HK')).toBe('zh-TW');
    expect(resolveGuardrailFormLocale('zh-Hans-CN')).toBe('zh-CN');
    expect(resolveGuardrailFormLocale('zh-SG')).toBe('zh-CN');
    expect(resolveGuardrailFormLocale('zh')).toBe('zh-CN');
  });

  it('returns undefined for unsupported or empty locales', () => {
    expect(resolveGuardrailFormLocale('xx')).toBeUndefined();
    expect(resolveGuardrailFormLocale('')).toBeUndefined();
    expect(resolveGuardrailFormLocale(undefined)).toBeUndefined();
  });
});

describe('loadGuardrailMessages', () => {
  it('loads a supported catalog', async () => {
    const messages = await loadGuardrailMessages('de');
    expect(messages.addItem).toBe('Hinzufügen');
  });

  it('falls back to the English catalog for unsupported locales', async () => {
    const messages = await loadGuardrailMessages('xx');
    expect(messages.addItem).toBe('Add');
  });

  it('loads every supported catalog and resolves complete labels from each', async () => {
    for (const locale of GUARDRAIL_FORM_LOCALES) {
      const messages = await loadGuardrailMessages(locale);
      const labels = resolveGuardrailFormLabels(messages);
      expect(labels.addItem.length, `addItem for ${locale}`).toBeGreaterThan(0);
      expect(labels.removeItem, `removeItem template for ${locale}`).toContain('{{label}}');
    }
  });

  it('returns a sparse catalog for locales without translations (per-key English fallback)', async () => {
    const messages = await loadGuardrailMessages('ru');
    expect(messages.addItem).toBeUndefined();
    expect(resolveGuardrailFormLabels(messages).addItem).toBe(GUARDRAIL_FORM_EN_LABELS.addItem);
  });
});

describe('formatGuardrailFormMessage', () => {
  it('interpolates tokens', () => {
    expect(
      formatGuardrailFormMessage('Remove {{label}} {{position}}', {
        label: 'Examples',
        position: 2,
      })
    ).toBe('Remove Examples 2');
  });

  it('leaves unknown tokens untouched', () => {
    expect(formatGuardrailFormMessage('Hi {{name}}', {})).toBe('Hi {{name}}');
  });
});

describe('resolveGuardrailFormLabels', () => {
  it('applies overrides on top of the catalog, skipping undefined values', () => {
    const labels = resolveGuardrailFormLabels(
      { addItem: 'Katalog' },
      { addItem: 'Override', enumPlaceholder: undefined }
    );
    expect(labels.addItem).toBe('Override');
    expect(labels.enumPlaceholder).toBe(GUARDRAIL_FORM_EN_LABELS.enumPlaceholder);
  });
});
