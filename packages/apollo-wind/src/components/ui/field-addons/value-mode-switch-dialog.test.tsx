import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ValueModeSwitchDialog } from './value-mode-switch-dialog';

describe('ValueModeSwitchDialog', () => {
  it('confirms or cancels the switch', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ValueModeSwitchDialog open onConfirm={onConfirm} onCancel={onCancel} />);

    expect(screen.getByRole('alertdialog', { name: 'Switch value mode?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Switch' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("prefers the codec's own wording, then the given strings", () => {
    render(
      <ValueModeSwitchDialog
        open
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        description="The expression cannot be converted."
        strings={{ lossyTitle: 'Changer de mode ?', confirm: 'Changer', cancel: 'Annuler' }}
      />
    );
    expect(screen.getByRole('alertdialog', { name: 'Changer de mode ?' })).toBeInTheDocument();
    expect(screen.getByText('The expression cannot be converted.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Changer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
  });
});
