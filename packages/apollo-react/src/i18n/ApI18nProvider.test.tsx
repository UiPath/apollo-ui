import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { i18n } from '@lingui/core';
import { Trans } from '@lingui/react';
import {
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import {
  ApI18nProvider,
  SUPPORTED_LOCALES,
  useApI18n,
} from './ApI18nProvider';

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
        'en', 'es', 'pt', 'de', 'fr', 'ja', 'ko', 'ru', 'tr',
        'zh-CN', 'zh-TW', 'pt-BR', 'es-MX',
      ]);
    });

    it('should derive SupportedLocale type from array', () => {
      // TypeScript compile-time check
      const locale: typeof SUPPORTED_LOCALES[number] = 'en';
      expect(locale).toBe('en');
    });
  });

  describe('Rendering', () => {
    it('should render children after loading locale', async () => {
      render(
        <ApI18nProvider component="test/fixtures" locale="en">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });
    });

    it('should not render children while loading', () => {
      const { container } = render(
        <ApI18nProvider component="test/fixtures" locale="en">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      // Initially null (loading)
      expect(container.firstChild).toBeNull();
    });

    it('should default to English when locale not specified', async () => {
      render(
        <ApI18nProvider component="test/fixtures">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });

      expect(i18n.locale).toBe('en');
    });
  });

  describe('Translation Strings', () => {
    it('should translate messages in English', async () => {
      render(
        <ApI18nProvider component="test/fixtures" locale="en">
          <div data-testid="translated">
            <Trans id="test.message" />
          </div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('translated')).toHaveTextContent('Hello World');
      });
    });

    it('should translate messages in Spanish', async () => {
      render(
        <ApI18nProvider component="test/fixtures" locale="es">
          <div data-testid="translated">
            <Trans id="test.message" />
          </div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('translated')).toHaveTextContent('Hola Mundo');
      });
    });

    it('should translate messages in French', async () => {
      render(
        <ApI18nProvider component="test/fixtures" locale="fr">
          <div data-testid="translated">
            <Trans id="test.message" />
          </div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('translated')).toHaveTextContent('Bonjour le monde');
      });
    });

    it('should translate multiple different messages', async () => {
      render(
        <ApI18nProvider component="test/fixtures" locale="en">
          <div>
            <div data-testid="message"><Trans id="test.message" /></div>
            <div data-testid="greeting"><Trans id="test.greeting" /></div>
          </div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Hello World');
        expect(screen.getByTestId('greeting')).toHaveTextContent('Welcome');
      });
    });

    it('should update translations when locale changes', async () => {
      const { rerender } = render(
        <ApI18nProvider component="test/fixtures" locale="en">
          <div data-testid="translated">
            <Trans id="test.message" />
          </div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('translated')).toHaveTextContent('Hello World');
      });

      rerender(
        <ApI18nProvider component="test/fixtures" locale="es">
          <div data-testid="translated">
            <Trans id="test.message" />
          </div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('translated')).toHaveTextContent('Hola Mundo');
      });

      rerender(
        <ApI18nProvider component="test/fixtures" locale="fr">
          <div data-testid="translated">
            <Trans id="test.message" />
          </div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('translated')).toHaveTextContent('Bonjour le monde');
      });
    });

    it('should show message ID when translation is missing', async () => {
      render(
        <ApI18nProvider component="test/fixtures" locale="en">
          <div data-testid="translated">
            <Trans id="nonexistent.key" />
          </div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('translated')).toHaveTextContent('nonexistent.key');
      });
    });
  });

  describe('Dynamic Updates', () => {
    it('should reload when locale changes', async () => {
      const { rerender } = render(
        <ApI18nProvider component="test/fixtures" locale="en">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });
      expect(i18n.locale).toBe('en');

      rerender(
        <ApI18nProvider component="test/fixtures" locale="es">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(i18n.locale).toBe('es');
      });
    });

    it('should reload when component path changes', async () => {
      const { rerender } = render(
        <ApI18nProvider component="test/fixtures" locale="en">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });

      rerender(
        <ApI18nProvider component="test/other" locale="en">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(consoleSpy.warn).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should fallback to English when locale file not found', async () => {
      render(
        <ApI18nProvider component="test/fixtures" locale="de">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load locale de'),
        expect.any(Error)
      );
      expect(i18n.locale).toBe('de');
    });

    it('should fallback to empty messages when component directory does not exist', async () => {
      render(
        <ApI18nProvider component="nonexistent/path" locale="en">
          <div data-testid="child">Content</div>
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });

      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load fallback locale')
      );
    });
  });

  describe('useApI18n Hook', () => {
    it('should return i18n instance', async () => {
      let hookResult: any;

      function TestComponent() {
        hookResult = useApI18n();
        return <div data-testid="child">Test</div>;
      }

      render(
        <ApI18nProvider component="test/fixtures" locale="en">
          <TestComponent />
        </ApI18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });

      expect(hookResult).toBe(i18n);
      expect(hookResult.locale).toBe('en');
    });
  });
});
