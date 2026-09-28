import { setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSafeLingui } from './useSafeLingui';

type TranslationDescriptor = {
  id: string;
  message?: string;
  values?: Record<string, unknown>;
};
type TranslationInput = TranslationDescriptor | string;

function TranslationProbe({ descriptor }: { descriptor: TranslationInput }) {
  const { _ } = useSafeLingui();
  const label = typeof descriptor === 'string' ? _(descriptor) : _(descriptor);

  return <span>{label}</span>;
}

describe('useSafeLingui', () => {
  it('returns string ids when no provider is mounted', () => {
    render(<TranslationProbe descriptor="test.message" />);

    expect(screen.getByText('test.message')).toBeInTheDocument();
  });

  it('returns descriptor messages when no provider is mounted', () => {
    render(<TranslationProbe descriptor={{ id: 'test.message', message: 'Hello world' }} />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('formats descriptor values when no provider is mounted', () => {
    render(
      <TranslationProbe
        descriptor={{
          id: 'loop-node.execution-count.jump-to-iteration',
          message: 'Jump to iteration {iterationNumber} (failed)',
          values: { iterationNumber: 2 },
        }}
      />
    );

    expect(screen.getByText('Jump to iteration 2 (failed)')).toBeInTheDocument();
  });

  // Production @lingui/core skips runtime message compilation, so these two
  // pin the pre-compiled fallback path that keeps ICU working in prod builds.
  it('formats plurals without a provider in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      render(
        <TranslationProbe
          descriptor={{
            id: 'test.plural',
            message: '{count, plural, one {# key} other {# keys}}',
            values: { count: 2 },
          }}
        />
      );
      expect(screen.getByText('2 keys')).toBeInTheDocument();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('formats ids missing from a mounted provider catalog in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      const testI18n = setupI18n({
        locale: 'es',
        messages: { es: { 'test.other': 'Otro' } },
      });
      render(
        <I18nProvider i18n={testI18n}>
          <TranslationProbe
            descriptor={{
              id: 'test.missing.plural',
              message: '{count, plural, one {# item} other {# items}}',
              values: { count: 3 },
            }}
          />
        </I18nProvider>
      );
      expect(screen.getByText('3 items')).toBeInTheDocument();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('uses the mounted Lingui provider when available', () => {
    const testI18n = setupI18n({
      locale: 'es',
      messages: {
        es: {
          'test.greeting': 'Hola {name}',
        },
      },
    });

    render(
      <I18nProvider i18n={testI18n}>
        <TranslationProbe
          descriptor={{
            id: 'test.greeting',
            message: 'Hello {name}',
            values: { name: 'Ada' },
          }}
        />
      </I18nProvider>
    );

    expect(screen.getByText('Hola Ada')).toBeInTheDocument();
  });
});
