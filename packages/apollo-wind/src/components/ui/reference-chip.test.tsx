import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ReferenceChip } from './reference-chip';
import { getReferenceChipColors } from './reference-chip-colors';

describe('ReferenceChip', () => {
  it('removes by keyboard without activating the containing picker or submitting a form', async () => {
    const user = userEvent.setup();
    const remove = vi.fn();
    const submit = vi.fn((event) => event.preventDefault());
    const hostClick = vi.fn();
    render(
      <form onSubmit={submit}>
        <ReferenceChip
          label="Connection"
          removeLabel="Clear connection"
          onRemove={remove}
          onClick={hostClick}
        />
      </form>
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Clear connection' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(remove).toHaveBeenCalledOnce();
    expect(hostClick).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });

  it('preserves editor focus and does not select the chip when removing with the mouse', async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    const remove = vi.fn();
    render(
      <>
        <input aria-label="Editor" />
        <ReferenceChip label="Variable" onMouseDown={select} onRemove={remove} />
      </>
    );
    screen.getByRole('textbox').focus();
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(select).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledOnce();
  });

  it('does not expose removal without a handler or in read-only mode, and disables it when disabled', async () => {
    const remove = vi.fn();
    const { rerender } = render(<ReferenceChip label="Connection" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<ReferenceChip label="Connection" readOnly onRemove={remove} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<ReferenceChip label="Connection" disabled onRemove={remove} />);
    expect(screen.getByRole('button')).toBeDisabled();
    await userEvent.click(screen.getByRole('button'));
    expect(remove).not.toHaveBeenCalled();
  });

  it('pairs background, text and icon from one semantic family', () => {
    const { rerender } = render(<ReferenceChip label="Connection" icon={<svg />} selected />);
    const chip = screen.getByText('Connection').closest('[data-slot="reference-chip"]');
    const icon = chip?.querySelector('[aria-hidden="true"]');
    expect(chip).toHaveStyle({
      backgroundColor: 'var(--color-info-background)',
      color: 'var(--color-info-text)',
      outline: '2px solid var(--color-info-icon)',
    });
    expect(icon).toHaveStyle({ color: 'var(--color-info-icon)' });

    rerender(<ReferenceChip label="Connection" icon={<svg />} invalid />);
    expect(chip).toHaveStyle({
      backgroundColor: 'var(--color-error-background)',
      color: 'var(--color-error-text)',
    });
    expect(icon).toHaveStyle({ color: 'var(--color-error-icon)' });
  });

  it('never uses primary or accent tokens', () => {
    const colors = Object.values(getReferenceChipColors()).flatMap(Object.values);
    for (const value of colors) {
      expect(value).toMatch(/^var\(--color-(info|error)-/);
    }
  });

  it('has no accessibility violations with a custom decorative icon', async () => {
    const { container } = render(
      <ReferenceChip
        label="Connection"
        icon={
          <svg>
            <title>Mail</title>
          </svg>
        }
        onRemove={() => {}}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
