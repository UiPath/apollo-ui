import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@lingui/core';
import { Trans } from '@lingui/react';
import { render, screen } from '@testing-library/react';

import { ApI18nProvider, SUPPORTED_LOCALES, useApI18n } from './ApI18nProvider';
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
