import { describe, expect, it } from 'vitest';

import {
  loadModelPickerMessages,
  MODEL_PICKER_LOCALES,
  resolveModelPickerLocale,
} from './loadMessages';

describe('resolveModelPickerLocale', () => {
  it('matches shipped tags case-insensitively and across separators', () => {
    expect(resolveModelPickerLocale('de')).toBe('de');
    expect(resolveModelPickerLocale('ZH-cn')).toBe('zh-CN');
    // Hosts source locales from PortalShell, navigator.language, or a prefs
    // API, so both separators show up in practice.
    expect(resolveModelPickerLocale('pt_BR')).toBe('pt-BR');
  });

  it('falls back to the base language for unshipped regional variants', () => {
    expect(resolveModelPickerLocale('fr-CA')).toBe('fr');
    expect(resolveModelPickerLocale('es-AR')).toBe('es');
  });

  it('resolves unknown or empty values to undefined', () => {
    expect(resolveModelPickerLocale(undefined)).toBeUndefined();
    expect(resolveModelPickerLocale('   ')).toBeUndefined();
    expect(resolveModelPickerLocale('kl-GL')).toBeUndefined();
  });
});

describe('loadModelPickerMessages', () => {
  it('loads a shipped catalog', async () => {
    const messages = await loadModelPickerMessages('de');
    expect(Object.keys(messages).length).toBeGreaterThan(0);
    // Every key is namespaced, so merging into a host catalog cannot collide
    // with app keys.
    expect(Object.keys(messages).every((k) => k.startsWith('modelPicker.'))).toBe(true);
  });

  it('falls back to English for an unknown locale instead of rejecting', async () => {
    const unknown = await loadModelPickerMessages('kl-GL');
    const english = await loadModelPickerMessages('en');
    expect(unknown).toEqual(english);
  });

  it('never rejects on a missing locale', async () => {
    await expect(loadModelPickerMessages(undefined)).resolves.toBeTruthy();
  });

  it('ships a catalog for every locale it advertises', async () => {
    const loaded = await Promise.all(
      MODEL_PICKER_LOCALES.map(async (tag) => [tag, await loadModelPickerMessages(tag)] as const)
    );
    for (const [tag, messages] of loaded) {
      expect(Object.keys(messages).length, `${tag} catalog is empty`).toBeGreaterThan(0);
    }
  });
});
