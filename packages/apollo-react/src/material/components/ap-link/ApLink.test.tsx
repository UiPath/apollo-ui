import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApLink } from './ApLink';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ApLink keyboard activation', () => {
  it('repeats noopener and noreferrer from rel when it opens a new tab', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <ApLink href="https://a.test/terms" target="_blank" rel="noopener noreferrer nofollow">
        Terms
      </ApLink>
    );

    fireEvent.keyDown(screen.getByRole('link', { name: 'Terms' }), { key: 'Enter' });

    expect(open).toHaveBeenCalledWith('https://a.test/terms', '_blank', 'noopener,noreferrer');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'rel',
      'noopener noreferrer nofollow'
    );
  });

  it('opens a new tab as before without rel', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <ApLink href="https://a.test/terms" target="_blank">
        Terms
      </ApLink>
    );

    fireEvent.keyDown(screen.getByRole('link', { name: 'Terms' }), { key: ' ' });

    expect(open).toHaveBeenCalledWith('https://a.test/terms', '_blank');
  });
});
