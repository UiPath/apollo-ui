import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApLocaleProvider, useApLocale } from './ApLocaleProvider';

function LocaleDisplay() {
  const locale = useApLocale();
  return <div data-testid="locale">{locale ?? 'undefined'}</div>;
}

describe('ApLocaleProvider', () => {
  it('should provide locale to children via context', () => {
    render(
      <ApLocaleProvider locale="fr">
        <LocaleDisplay />
      </ApLocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('fr');
  });

  it('should return undefined when used outside provider', () => {
    render(<LocaleDisplay />);

    expect(screen.getByTestId('locale')).toHaveTextContent('undefined');
  });

  it('should update when locale prop changes', () => {
    const { rerender } = render(
      <ApLocaleProvider locale="en">
        <LocaleDisplay />
      </ApLocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('en');

    rerender(
      <ApLocaleProvider locale="ja">
        <LocaleDisplay />
      </ApLocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('ja');
  });
});
