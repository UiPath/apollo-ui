import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Label } from './label';
import { PasswordInput } from './password-input';

describe('PasswordInput', () => {
  it('masks the value by default and toggles it', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" defaultValue="secret" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('syncs controlled visibility across fields', async () => {
    const user = userEvent.setup();
    function Pair() {
      const [visible, setVisible] = useState(false);
      return (
        <>
          <PasswordInput aria-label="New" visible={visible} onVisibleChange={setVisible} />
          <PasswordInput
            aria-label="Confirm"
            visible={visible}
            onVisibleChange={setVisible}
            showLabel="Show confirmation"
          />
        </>
      );
    }
    render(<Pair />);
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('New')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Confirm')).toHaveAttribute('type', 'text');
  });

  it('disables the toggle with the input', () => {
    render(<PasswordInput aria-label="Password" disabled />);
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards ref to the input', () => {
    const ref = { current: null };
    render(<PasswordInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="pw">Password</Label>
        <PasswordInput id="pw" />
      </div>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the translated label as a tooltip', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Mot de passe" showLabel="Afficher" hideLabel="Masquer" />);
    await user.hover(screen.getByRole('button', { name: 'Afficher' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Afficher');

    await user.click(screen.getByRole('button', { name: 'Afficher' }));
    expect(screen.getByRole('button', { name: 'Masquer' })).toBeInTheDocument();
  });

  it('reports the next visibility to onVisibleChange', async () => {
    const user = userEvent.setup();
    const onVisibleChange = vi.fn();
    render(<PasswordInput aria-label="Password" onVisibleChange={onVisibleChange} />);
    await user.click(screen.getByRole('button'));
    expect(onVisibleChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole('button'));
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
  });

  it('lets a controlled visible prop win over clicks', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" visible={false} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('starts revealed with defaultVisible', () => {
    render(<PasswordInput aria-label="Password" defaultVisible />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('turns off text-entry hints so a revealed value is not corrected', () => {
    render(<PasswordInput aria-label="Password" defaultVisible />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('autocapitalize', 'off');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('renders the error message with the given errorId', () => {
    render(<PasswordInput aria-label="Password" error="Required" errorId="password-error" />);
    expect(document.getElementById('password-error')).toHaveTextContent('Required');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-describedby', 'password-error');
  });
});
