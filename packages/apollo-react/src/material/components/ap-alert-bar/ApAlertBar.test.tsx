import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatusTypes } from '../../../types/statusTypes';
import { ApAlertBar } from './ApAlertBar';

describe('ApAlertBar', () => {
  it('renders its children', () => {
    render(<ApAlertBar status={StatusTypes.ERROR}>Something went wrong</ApAlertBar>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders the icon for its status', () => {
    render(<ApAlertBar status={StatusTypes.WARNING}>Careful</ApAlertBar>);
    expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();
  });

  // The icon and text must not depend on the host's line-height: as inline
  // boxes they sit on the inherited line box, so a taller line-height (e.g.
  // Tailwind's base 1.5) pushes the icon below the first line of text.
  it('renders the icon and text as block-level boxes', () => {
    render(<ApAlertBar status={StatusTypes.ERROR}>Something went wrong</ApAlertBar>);
    expect(getComputedStyle(screen.getByTestId('ErrorIcon')).display).toBe('block');
    expect(getComputedStyle(screen.getByText('Something went wrong')).display).toBe('block');
  });

  it('dismisses and calls onCancel when the close button is clicked', async () => {
    const onCancel = vi.fn();
    render(
      <ApAlertBar status={StatusTypes.INFO} onCancel={onCancel}>
        Heads up
      </ApAlertBar>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Heads up')).not.toBeInTheDocument();
  });

  it('hides the close button when not cancelable', () => {
    render(
      <ApAlertBar status={StatusTypes.INFO} cancelable={false}>
        Heads up
      </ApAlertBar>
    );
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });
});
