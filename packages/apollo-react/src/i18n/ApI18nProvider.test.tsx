import { i18n } from '@lingui/core';
import { Trans } from '@lingui/react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ApI18nProvider,
  resolveSupportedLocale,
  SUPPORTED_LOCALES,
  useApI18n,
} from './ApI18nProvider';
import { getAllPreImportedLocales } from './locale-registry';

// Test message catalogs - pre-loaded directly into i18n for testing
const testMessages = {
  en: {
    'test.message': 'Hello World',
    'test.greeting': 'Welcome',
  },
  es: {
    'test.message': 'Hola Mundo',
    'test.greeting': 'Bienvenido',
  },
  fr: {
    'test.message': 'Bonjour le monde',
    'test.greeting': 'Bienvenue',
  },
};

// Mock console to avoid noise
const consoleSpy = {
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('ApI18nProvider', () => {
  beforeEach(() => {
    // Pre-load test messages into i18n
    Object.entries(testMessages).forEach(([locale, messages]) => {
      i18n.load(locale, messages);
    });
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export supported locales array', () => {
      expect(SUPPORTED_LOCALES).toEqual([
        'en',
        'es',
        'pt',
        'de',
        'fr',
        'ja',
        'ko',
        'ru',
        'tr',
        'zh-CN',
        'zh-TW',
        'pt-BR',
        'es-MX',
        'ro',
      ]);
    });

    it('should derive SupportedLocale type from array', () => {
      // TypeScript compile-time check
      const locale: (typeof SUPPORTED_LOCALES)[number] = 'en';
      expect(locale).toBe('en');
    });
  });

  describe('Rendering', () => {
    it('should render children immediately', () => {
      render(
        <ApI18nProvider component="material/components/ap-chat" locale="en">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      // Children render immediately with pre-imported locales
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should default to English when locale not specified', () => {
      render(
        <ApI18nProvider component="material/components/ap-chat">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(i18n.locale).toBe('en');
    });

    it('should use document.documentElement.lang when no locale prop is given', () => {
      i18n.load('es', testMessages.es);
      const originalLang = document.documentElement.lang;
      document.documentElement.lang = 'es';

      render(
        <ApI18nProvider component="material/components/ap-chat">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(i18n.locale).toBe('es');
      document.documentElement.lang = originalLang;
    });

    it('should prefer explicit locale prop over document.documentElement.lang', () => {
      i18n.load('fr', testMessages.fr);
      const originalLang = document.documentElement.lang;
      document.documentElement.lang = 'es';

      render(
        <ApI18nProvider component="material/components/ap-chat" locale="fr">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(i18n.locale).toBe('fr');
      document.documentElement.lang = originalLang;
    });

    it('should fall back to English when neither prop nor document lang is set', () => {
      const originalLang = document.documentElement.lang;
      document.documentElement.lang = '';

      render(
        <ApI18nProvider component="material/components/ap-chat">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      document.documentElement.lang = originalLang;

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(i18n.locale).toBe('en');
    });
  });

  describe('Translation Strings', () => {
    it('should translate messages in English', () => {
      i18n.load('en', testMessages.en);
      i18n.activate('en');

      render(
        <ApI18nProvider component="material/components/ap-chat" locale="en">
          <div data-testid="translated">
            <Trans id="test.message" />
          </div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('translated')).toHaveTextContent('Hello World');
    });

    it('should translate messages in Spanish', () => {
      i18n.load('es', testMessages.es);
      i18n.activate('es');

      render(
        <ApI18nProvider component="material/components/ap-chat" locale="es">
          <div data-testid="translated">
            <Trans id="test.message" />
          </div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('translated')).toHaveTextContent('Hola Mundo');
    });

    it('should translate messages in French', () => {
      i18n.load('fr', testMessages.fr);
      i18n.activate('fr');

      render(
        <ApI18nProvider component="material/components/ap-chat" locale="fr">
          <div data-testid="translated">
            <Trans id="test.message" />
          </div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('translated')).toHaveTextContent('Bonjour le monde');
    });

    it('should translate multiple different messages', () => {
      i18n.load('en', testMessages.en);
      i18n.activate('en');

      render(
        <ApI18nProvider component="material/components/ap-chat" locale="en">
          <div>
            <div data-testid="message">
              <Trans id="test.message" />
            </div>
            <div data-testid="greeting">
              <Trans id="test.greeting" />
            </div>
          </div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('message')).toHaveTextContent('Hello World');
      expect(screen.getByTestId('greeting')).toHaveTextContent('Welcome');
    });

    it('should show message ID when translation is missing', () => {
      i18n.load('en', testMessages.en);
      i18n.activate('en');

      render(
        <ApI18nProvider component="material/components/ap-chat" locale="en">
          <div data-testid="translated">
            <Trans id="nonexistent.key" />
          </div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('translated')).toHaveTextContent('nonexistent.key');
    });
  });

  describe('Registry', () => {
    it('should have all registered components in registry', () => {
      // Verify ap-chat is in registry
      const apChatLocales = getAllPreImportedLocales('material/components/ap-chat');
      expect(apChatLocales).toBeDefined();

      // Verify ap-tool-call is in registry
      const apToolCallLocales = getAllPreImportedLocales('material/components/ap-tool-call');
      expect(apToolCallLocales).toBeDefined();
    });

    it('should serve chat catalogs under both the chat key and the legacy ap-chat key', () => {
      const chatLocales = getAllPreImportedLocales('chat');
      expect(chatLocales).toBeDefined();
      expect(getAllPreImportedLocales('material/components/ap-chat')).toBe(chatLocales);
    });

    it('should have all SUPPORTED_LOCALES for each registered component', () => {
      const apChatLocales = getAllPreImportedLocales('material/components/ap-chat');

      // Verify all 13 locales are present
      SUPPORTED_LOCALES.forEach((locale) => {
        expect(apChatLocales?.[locale]).toBeDefined();
        expect(typeof apChatLocales?.[locale]).toBe('object');
      });
    });

    it('should load all locales from registry on mount', () => {
      // Spy on i18n.load to verify all locales are loaded
      const loadSpy = vi.spyOn(i18n, 'load');

      render(
        <ApI18nProvider component="material/components/ap-chat" locale="en">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();

      // Verify i18n.load was called for all supported locales
      SUPPORTED_LOCALES.forEach((locale) => {
        expect(loadSpy).toHaveBeenCalledWith(locale, expect.any(Object));
      });

      loadSpy.mockRestore();
    });

    it('should activate the requested locale', () => {
      const activateSpy = vi.spyOn(i18n, 'activate');

      render(
        <ApI18nProvider component="material/components/ap-chat" locale="es">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(activateSpy).toHaveBeenCalledWith('es');

      activateSpy.mockRestore();
    });

    it('should handle missing component gracefully without crashing', () => {
      // Should not throw, just log error
      expect(() => {
        render(
          <ApI18nProvider component="nonexistent/path" locale="en">
            <div data-testid="child">Content</div>
          </ApI18nProvider>
        );
      }).not.toThrow();

      // Children still render
      expect(screen.getByTestId('child')).toBeInTheDocument();

      // Error is logged
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'No locales found for component: nonexistent/path'
      );

      // i18n is still activated (with empty messages)
      expect(i18n.locale).toBe('en');
    });

    it('should load empty messages when component not in registry', () => {
      const loadSpy = vi.spyOn(i18n, 'load');
      loadSpy.mockClear();

      render(
        <ApI18nProvider component="nonexistent/path" locale="en">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      // i18n.load should be called once with empty messages for the requested locale
      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(loadSpy).toHaveBeenCalledWith('en', {});

      loadSpy.mockRestore();
    });
  });

  describe('Host locale reconciliation', () => {
    const originalLang = document.documentElement.lang;

    // The lingui singleton is shared by every test: start each one with empty
    // buckets for the tags used here, so no test sees another one's strings.
    beforeEach(() => {
      ['zh-tw', 'zh-TW', 'pt-br', 'pt-BR', 'ja'].forEach((locale) => {
        i18n.loadAndActivate({ locale, messages: {} });
      });
    });

    afterEach(() => {
      document.documentElement.lang = originalLang;
    });

    // The shell writes <html lang> lowercased, and lingui keys its message
    // buckets by the exact string a host passed to loadAndActivate. Resolving
    // 'zh-tw' to the canonical 'zh-TW' and activating *that* would point the
    // shared singleton at a bucket the host never wrote to.
    it('should keep the host bucket active when the page lang differs only by case', () => {
      document.documentElement.lang = 'zh-tw';
      i18n.loadAndActivate({ locale: 'zh-tw', messages: { 'host.string': '主機字串' } });

      render(
        <ApI18nProvider component="canvas">
          <div data-testid="translated">
            <Trans id="host.string" />
          </div>
        </ApI18nProvider>
      );

      expect(i18n.locale).toBe('zh-tw');
      expect(screen.getByTestId('translated')).toHaveTextContent('主機字串');
    });

    it('should file its own catalog under the host spelling so canvas strings resolve', () => {
      document.documentElement.lang = 'zh-tw';
      i18n.loadAndActivate({ locale: 'zh-tw', messages: { 'host.string': '主機字串' } });

      render(
        <ApI18nProvider component="canvas">
          <div data-testid="translated">
            <Trans id="add-node-panel.search-nodes" />
          </div>
        </ApI18nProvider>
      );

      expect(screen.getByTestId('translated')).toHaveTextContent('搜尋節點');
    });

    it('should resolve a case-mismatched page lang to its catalog, not English', () => {
      document.documentElement.lang = 'PT-br';
      i18n.loadAndActivate({ locale: 'en', messages: {} });

      render(
        <ApI18nProvider component="canvas">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      expect(i18n.locale).toBe('pt-BR');
    });

    it('should still switch language when the host is on a different one', () => {
      document.documentElement.lang = 'ja';
      i18n.loadAndActivate({ locale: 'zh-tw', messages: {} });

      render(
        <ApI18nProvider component="canvas">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      expect(i18n.locale).toBe('ja');
    });

    it('should honour the spelling an explicit locale prop uses', () => {
      i18n.loadAndActivate({ locale: 'en', messages: {} });

      render(
        <ApI18nProvider component="canvas" locale="zh-tw">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      expect(i18n.locale).toBe('zh-tw');
    });
    it('should keep the host bucket when an explicit prop uses another spelling', () => {
      i18n.loadAndActivate({ locale: 'zh-TW', messages: { 'host.string': '主機字串' } });

      render(
        <ApI18nProvider component="canvas" locale="zh-tw">
          <div data-testid="host">
            <Trans id="host.string" />
          </div>
          <div data-testid="canvas">
            <Trans id="add-node-panel.search-nodes" />
          </div>
        </ApI18nProvider>
      );

      expect(i18n.locale).toBe('zh-TW');
      expect(screen.getByTestId('host')).toHaveTextContent('主機字串');
      expect(screen.getByTestId('canvas')).toHaveTextContent('搜尋節點');
    });

    it('should activate a padded locale prop without its spaces', () => {
      i18n.loadAndActivate({ locale: 'en', messages: {} });

      render(
        <ApI18nProvider component="canvas" locale=" zh-tw ">
          <div data-testid="canvas">
            <Trans id="add-node-panel.search-nodes" />
          </div>
        </ApI18nProvider>
      );

      expect(i18n.locale).toBe('zh-tw');
      expect(screen.getByTestId('canvas')).toHaveTextContent('搜尋節點');
    });

    it('should add its strings when the host switches language after mount', () => {
      document.documentElement.lang = 'en';
      i18n.loadAndActivate({ locale: 'en', messages: {} });
      render(
        <ApI18nProvider component="canvas">
          <div data-testid="host">
            <Trans id="host.string" />
          </div>
          <div data-testid="canvas">
            <Trans id="add-node-panel.search-nodes" />
          </div>
        </ApI18nProvider>
      );

      act(() => {
        i18n.loadAndActivate({ locale: 'zh-tw', messages: { 'host.string': '主機字串' } });
      });

      expect(i18n.locale).toBe('zh-tw');
      expect(screen.getByTestId('host')).toHaveTextContent('主機字串');
      expect(screen.getByTestId('canvas')).toHaveTextContent('搜尋節點');
    });

    it.each([
      ['a stale page lang', undefined],
      ['a stale locale prop', 'pt-BR'],
    ])('should not pull the host back after it switches language, with %s', (_, prop) => {
      document.documentElement.lang = 'pt-br';
      i18n.loadAndActivate({ locale: 'pt-br', messages: { 'host.string': 'host pt-br' } });
      const ui = () => (
        <ApI18nProvider component="canvas" locale={prop}>
          <div data-testid="host">
            <Trans id="host.string" />
          </div>
          <div data-testid="canvas">
            <Trans id="add-node-panel.search-nodes" />
          </div>
        </ApI18nProvider>
      );
      const { rerender } = render(ui());

      act(() => {
        i18n.loadAndActivate({ locale: 'zh-tw', messages: { 'host.string': '主機字串' } });
      });
      // A new element, so React re-renders the provider as a parent would.
      rerender(ui());

      expect(i18n.locale).toBe('zh-tw');
      expect(screen.getByTestId('host')).toHaveTextContent('主機字串');
      expect(screen.getByTestId('canvas')).toHaveTextContent('搜尋節點');
    });

    it('should settle when two providers fill the bucket after a switch', () => {
      document.documentElement.lang = 'en';
      i18n.loadAndActivate({ locale: 'en', messages: {} });
      render(
        <>
          <ApI18nProvider component="canvas">
            <div data-testid="canvas">
              <Trans id="add-node-panel.search-nodes" />
            </div>
          </ApI18nProvider>
          <ApI18nProvider component="chat">
            <div />
          </ApI18nProvider>
        </>
      );
      const changes = vi.fn();
      const unsubscribe = i18n.on('change', changes);

      act(() => {
        i18n.loadAndActivate({ locale: 'zh-tw', messages: {} });
      });
      unsubscribe();

      expect(screen.getByTestId('canvas')).toHaveTextContent('搜尋節點');
      // The host's switch, then one fill per provider.
      expect(changes.mock.calls.length).toBeLessThanOrEqual(3);
    });
  });

  describe('resolveSupportedLocale', () => {
    it('should match regardless of case', () => {
      expect(resolveSupportedLocale('zh-tw')).toBe('zh-TW');
      expect(resolveSupportedLocale('ZH-TW')).toBe('zh-TW');
      expect(resolveSupportedLocale('pt-br')).toBe('pt-BR');
      expect(resolveSupportedLocale('es-mx')).toBe('es-MX');
      expect(resolveSupportedLocale('JA')).toBe('ja');
    });

    it('should return the canonical spelling unchanged', () => {
      SUPPORTED_LOCALES.forEach((locale) => {
        expect(resolveSupportedLocale(locale)).toBe(locale);
      });
    });

    it('should tolerate surrounding whitespace', () => {
      expect(resolveSupportedLocale(' zh-tw ')).toBe('zh-TW');
    });

    it('should return undefined for an unshipped or empty tag', () => {
      expect(resolveSupportedLocale('zh')).toBeUndefined();
      expect(resolveSupportedLocale('fr-CA')).toBeUndefined();
      expect(resolveSupportedLocale('')).toBeUndefined();
      expect(resolveSupportedLocale(undefined)).toBeUndefined();
    });
  });

  describe('useApI18n Hook', () => {
    it('should return i18n instance', () => {
      let hookResult: typeof i18n | undefined;

      function TestComponent() {
        hookResult = useApI18n();
        return <div data-testid="child">Test</div>;
      }

      render(
        <ApI18nProvider component="material/components/ap-chat" locale="en">
          <TestComponent />
        </ApI18nProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(hookResult).toBeDefined();
      expect(hookResult).toBe(i18n);
      expect(hookResult!.locale).toBe('en');
    });
  });
});
