import { setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSafeLingui } from './useSafeLingui';

type TranslationDescriptor = { id: string; message?: string; values?: Record<string, unknown> };
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
          descriptor={{ id: 'test.greeting', message: 'Hello {name}', values: { name: 'Ada' } }}
        />
      </I18nProvider>
    );

    expect(screen.getByText('Hola Ada')).toBeInTheDocument();
  });
});
