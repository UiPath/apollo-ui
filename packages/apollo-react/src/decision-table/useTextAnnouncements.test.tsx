import { act, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { useSafeLingui } from '../i18n/useSafeLingui';
import { type TextAnnouncements, useTextAnnouncements } from './useTextAnnouncements';

const announcer = () => {
  const handle: { current: TextAnnouncements | null } = { current: null };
  const Host = () => {
    const { _ } = useSafeLingui();
    const announcements = useTextAnnouncements(_, 'text');
    handle.current = announcements;
    return <>{announcements.region}</>;
  };
  render(<Host />);
  return handle;
};

describe('useTextAnnouncements', () => {
  it('starts silent in a polite status region', () => {
    announcer();
    const region = screen.getByRole('status');
    expect(region).toBe(screen.getByTestId('text-live'));
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('');
  });

  it('announces a move by 1-based positions in the polite region, with no axe violations', async () => {
    const handle = announcer();
    act(() => handle.current?.announceMove(0, 2));
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Rule moved from position 1 to 3');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('announces the same text again as a new node', () => {
    const handle = announcer();
    act(() => handle.current?.announce('Not saved: x'));
    const first = screen.getByTestId('text-live').firstElementChild;
    act(() => handle.current?.announce('Not saved: x'));
    const second = screen.getByTestId('text-live').firstElementChild;
    expect(second).toHaveTextContent('Not saved: x');
    expect(second).not.toBe(first);
  });
});
